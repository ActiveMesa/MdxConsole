namespace ActiveMesa.MdxConsole
{
  using System;
  using System.Collections.Generic;
  using System.ComponentModel;
  using System.Diagnostics;
  using System.Drawing;
  using System.Linq;
  using System.Threading;
  using System.Threading.Tasks;
  using System.Windows.Forms;
  using Microsoft.DirectX;
  using Microsoft.DirectX.Direct3D;

  /// <summary>
  /// Represents either a form or a full-screen application that contains a
  /// DirectX-driven console.
  /// </summary>
  public class Console : Form
  {
    private const float distanceToObject = 1.0f;
    private readonly Device device;
    private readonly PresentParameters pp;
    private readonly TextureManager texManager;
    private IList<Viewport> viewports;
    private Color backgroundColor = Color.Black;
    private Size charSize;
    private Color foregroundColor = Color.White;
    private Size gridSize;
    private VertexBuffer vb;
    private const int TakeScreenshotCommandId = 1000;

    public static Console Create(ConsoleCreationParameters ccp)
    {
      bool fullScreen = ccp.FullScreen;
      var c = new Console(fullScreen, ccp.CharacterWidth, ccp.CharacterHeight, ccp.Width, ccp.Height, ccp.ClientSize);
      if (ccp.CreateDefaultViewAndBuffer)
        c.Viewports.Add(new Viewport(new Buffer(ccp.Width, ccp.Height)));
      return c;
    }

    public Buffer[] CreateBuffersWithMachingViewports(int bufferWidth)
    {
      // how many can we fit in
      int count = (int) Math.Floor(gridSize.Width/(float) bufferWidth);
      if (count < 1)
        throw new ArgumentException("Buffer too wide", "bufferWidth");

      var buffers = new Buffer[count];
      for (int i = 0; i < count; ++i)
      {
        var b = new Buffer(bufferWidth, gridSize.Height);
        var v = new Viewport(b, b.Size, Point.Empty, new Point(i*bufferWidth, 0));
        buffers[i] = b;
        Viewports.Add(v);
      }
      return buffers;
    }

    /// <summary>
    /// Creates a console.
    /// </summary>
    /// <param name="fullScreen">A flag to indicate whether the console should be full-screen.</param>
    /// <param name="charWidth">Width of a character.</param>
    /// <param name="charHeight">Height of a character.</param>
    /// <param name="width"></param>
    /// <param name="height"></param>
    /// <param name="clientSize"></param>
    private Console(bool fullScreen, int charWidth, int charHeight, int width, int height, Size? clientSize)
    {
      int windowWidth = clientSize == null ? charWidth*width : clientSize.Value.Width;
      int windowHeight = clientSize == null ? charHeight*height : clientSize.Value.Height;

      #region some obvious window settings

      // if this is windowed and size is provided, set it
      if (!fullScreen && windowWidth >= 0 && windowHeight >= 0)
      {
        ClientSize = new Size(windowWidth, windowHeight);
      } // if this is full-screen, get the size and set it
      else if (fullScreen)
      {
        FormBorderStyle = FormBorderStyle.None;
        ClientSize = new Size(Manager.Adapters[0].CurrentDisplayMode.Width,
                              Manager.Adapters[0].CurrentDisplayMode.Height);
      }

      // allowing min/max is a bad idea
      MaximizeBox = MinimizeBox = false;
      StartPosition = FormStartPosition.CenterParent;

      #endregion

      CreateAppIconMenu();

      Load += OnLoad;

      FullScreen = fullScreen;
      InitializePresentParameters(out pp, fullScreen);

      #region create device and wire events

      // here are a couple of pairs to try
      var pairsToTry = new[]
      {
        new Pair<DeviceType, CreateFlags>(DeviceType.Hardware, CreateFlags.HardwareVertexProcessing),
        new Pair<DeviceType, CreateFlags>(DeviceType.Hardware, CreateFlags.SoftwareVertexProcessing),
        new Pair<DeviceType, CreateFlags>(DeviceType.Software, CreateFlags.SoftwareVertexProcessing),
        new Pair<DeviceType, CreateFlags>(DeviceType.Reference, CreateFlags.SoftwareVertexProcessing),
      };

      for (int i = 0; i < pairsToTry.Length; i++)
      {
        Pair<DeviceType, CreateFlags> p = pairsToTry[i];
        try
        {
          device = new Device(0, p.First, this, p.Second, pp);
          break;
        }
        catch
        {
          continue;
        }
      }

      if (device == null)
        throw new ApplicationException("Could not create device.");

      device.DeviceReset += OnResetDevice;
      device.DeviceLost += OnLostDevice;
      device.DeviceResizing += OnResizeDevice;

      OnResetDevice(device, null);

      #endregion

      texManager = new TextureManager(device, charWidth, charHeight);
      charSize = new Size(charWidth, charHeight);
      gridSize = new Size((int)Math.Floor((double)ClientSize.Width / charWidth),
                          (int)Math.Floor((double)ClientSize.Height / charHeight));
      Debug.WriteLine(string.Format("Grid size has been set to {0} by {1}", gridSize.Width, gridSize.Height));
    }

    /// <summary>
    /// This method adds an application menu item to take screenshots.
    /// Fired commands are handled in <c>WndProc()</c>.
    /// </summary>
    private void CreateAppIconMenu()
    {
      var sysMenuHandle = NativeMethods.GetSystemMenu(Handle, false);
      NativeMethods.InsertMenu(sysMenuHandle, -1, NativeMethods.MF_BYPOSITION | NativeMethods.MF_SEPARATOR, 0,
                               String.Empty);
      NativeMethods.InsertMenu(sysMenuHandle, -1, NativeMethods.MF_BYPOSITION, TakeScreenshotCommandId,
                               "Take Screenshot");
    }

    protected override void WndProc(ref Message m)
    {
      if (m.Msg == NativeMethods.WM_SYSCOMMAND)
      {
        switch (m.WParam.ToInt32())
        {
          case TakeScreenshotCommandId:
            TakeScreenshot();
            return;
          default:
            break;
        }
      }
      base.WndProc(ref m);
    }

    /// <summary>
    /// A flag to inficate whether the console is full-screen or not.
    /// </summary>
    public bool FullScreen { get; protected internal set; }

    /// <summary>
    /// Background color.
    /// </summary>
    public Color BackgroundColor
    {
      get { return backgroundColor; }
      set { backgroundColor = value; }
    }

    /// <summary>
    /// Foreground (i.e., text) color.
    /// </summary>
    public Color ForegroundColor
    {
      get { return foregroundColor; }
      set { foregroundColor = value; }
    }

    /// <summary>
    /// The list of viewports in this console.
    /// </summary>
    public IList<Viewport> Viewports
    {
      get { return viewports ?? (viewports = new List<Viewport>()); }
    }

    /// <summary>
    /// The texture manager for this console.
    /// </summary>
    public TextureManager TexManager
    {
      get { return texManager; }
    }

    public int CurrentViewportIndex
    {
      get;
      set;
    }

    /// <summary>
    /// The viewport that is currently receiving input.
    /// </summary>
    public Viewport CurrentViewport
    {
      get
      {
        return Viewports[CurrentViewportIndex];
      }
    }

    /// <summary>
    /// The buffer associated with the viewport that is currently receiving input.
    /// </summary>
    public Buffer CurrentBuffer
    {
      get
      {
        if (CurrentViewportIndex >= Viewports.Count)
          return null;
        return Viewports[CurrentViewportIndex].Buffer;
      }
    }

    /// <summary>
    /// Writes a string using the default format.
    /// </summary>
    /// <param name="s"></param>
    /// <returns></returns>
    public Console Write(string s)
    {
      return WriteFormat(s, 0);
    }

    /// <summary>
    /// Writes a string and a line break.
    /// </summary>
    /// <param name="s"></param>
    /// <param name="args"></param>
    /// <returns></returns>
    public Console WriteLine(string s, params object[] args)
    {
      return Write(string.Format(s, args) + Environment.NewLine);
    }

    public Console WriteLineFormat(string s, short format, params object[] args)
    {
      return WriteFormat(string.Format(s, args) + Environment.NewLine, format);
    }

    public Console WriteFormat(string s, short format)
    {
      if (Viewports.Count > 0)
        if (Viewports[CurrentViewportIndex].Buffer != null)
          Viewports[CurrentViewportIndex].Buffer.Write(s, format);
      return this;
    }

    /// <summary>
    /// Sets up the vertex buffer to hold a rectangle of a size matching the
    /// size of a glyph texture.
    /// </summary>
    /// <param name="sender">The vertex buffer.</param>
    /// <param name="e">Typically <c>null</c>.</param>
    private void OnCreateVertexBuffer(object sender, EventArgs e)
    {
      // co-ordinates are explicitly shifted by half a pixel each way
      // to compensate for pixel/texel mismatch
      var v = (CustomVertex.PositionTextured[])vb.Lock(0, 0);
      v[0].X = 0.0f + 0.5f;
      v[0].Y = 0.0f + 0.5f;
      v[0].Z = 0.0f;
      v[0].Tu = 0.0f;
      v[0].Tv = 1.0f;

      v[1].X = charSize.Width + 0.5f;
      v[1].Y = 0.0f + 0.5f;
      v[1].Z = 0.0f;
      v[1].Tu = 1.0f;
      v[1].Tv = 1.0f;

      v[2].X = charSize.Width + 0.5f;
      v[2].Y = charSize.Height + 0.5f;
      v[2].Z = 0.0f;
      v[2].Tu = 1.0f;
      v[2].Tv = 0.0f;

      v[3].X = 0.0f + 0.5f;
      v[3].Y = charSize.Height + 0.5f;
      v[3].Z = 0.0f;
      v[3].Tu = 0.0f;
      v[3].Tv = 0.0f;

      vb.Unlock();
    }


    private void OnLoad(object sender, EventArgs e)
    {
      // create an ordinary vertex buffer
      vb = new VertexBuffer(
        typeof(CustomVertex.PositionTextured), 4, device,
        Usage.WriteOnly, CustomVertex.PositionTextured.Format, Pool.Default);
      vb.Created += OnCreateVertexBuffer;
      OnCreateVertexBuffer(vb, null);
    }

    /// <summary>
    /// Initializes a <c>PresentParameters</c> structure.
    /// </summary>
    /// <param name="presentParams">A <c>PresentParameters</c> structure.</param>
    /// <param name="fullscreen">If true, the parameters will be initialized for a
    /// full-screen application; otherwise, they will be initialized for a windowed
    /// application.</param>
    /// <seealso cref="PresentParameters"/>
    private void InitializePresentParameters(out PresentParameters presentParams, bool fullscreen)
    {
      presentParams = new PresentParameters();

      if (fullscreen)
      {
        #region Fullscreen

        const Format adapterFormat = Format.X8R8G8B8;
        DisplayMode dm = Manager.Adapters[0].CurrentDisplayMode;
        presentParams.BackBufferWidth = dm.Width;
        presentParams.BackBufferHeight = dm.Height;
        presentParams.BackBufferFormat = adapterFormat;
        presentParams.BackBufferCount = 1;
        presentParams.MultiSample = MultiSampleType.None;
        presentParams.MultiSampleQuality = 0;
        presentParams.SwapEffect = SwapEffect.Discard;
        presentParams.DeviceWindowHandle = Handle;
        presentParams.Windowed = false;
        presentParams.EnableAutoDepthStencil = true;
        presentParams.AutoDepthStencilFormat = DepthFormat.D16;
        presentParams.PresentFlag = PresentFlag.DiscardDepthStencil;
        presentParams.FullScreenRefreshRateInHz = dm.RefreshRate;
        presentParams.PresentationInterval = PresentInterval.Immediate;

        #endregion
      }
      else
      {
        #region Windowed

        presentParams.SwapEffect = SwapEffect.Discard;
        presentParams.Windowed = true;
        presentParams.AutoDepthStencilFormat = DepthFormat.D16;
        presentParams.EnableAutoDepthStencil = true;

        #endregion
      }
    }

    private void ResetDeviceStates()
    {
      device.RenderState.CullMode = Cull.None;
      device.RenderState.Lighting = false;
      device.RenderState.ZBufferEnable = false;
      device.SetSamplerState(0, SamplerStageStates.MinFilter, 0);
      device.SetSamplerState(0, SamplerStageStates.MagFilter, 0);
    }

    /// <summary>
    /// Renders the window area.
    /// </summary>
    public void Render()
    {
      if (!device.Disposed)
      {
        try
        {
          device.TestCooperativeLevel();
          device.Clear(ClearFlags.Target | ClearFlags.ZBuffer, backgroundColor, 1.0f, 0);
          device.BeginScene();
          {
            SetupMatrices();
            RenderConsole();
          }
          device.EndScene();
          device.Present();
        }
        catch (DeviceLostException)
        {
          Thread.Sleep(500);
        }
        catch (DeviceNotResetException)
        {
          device.Reset();
        }
        catch (Exception ex)
        {
          MessageBox.Show(ex.Message);
        }
      }
    }

    /// <summary>
    /// The size of the actual console, in pixels.
    /// </summary>
    public Size ConsolePixelSize
    {
      get { return new Size(gridSize.Width*charSize.Width, charSize.Height*gridSize.Height); }
    }

    /// <summary>
    /// Takes the screenshot of the current state of the console and puts it
    /// on the clipboard. Excludes window bounds, so you only get the console
    /// itself.
    /// </summary>
    public void TakeScreenshot()
    {
      Thread.Sleep(1000); // help UI get out of the way
      var size = ClientSize;
      using (var bmp = new Bitmap(size.Width, size.Height))
      using (var g = Graphics.FromImage(bmp))
      {
        g.CopyFromScreen(PointToScreen(Point.Empty), Point.Empty, size);
        Clipboard.SetImage(bmp);
      }
    }

    private void RenderConsole()
    {
      device.Transform.View = Matrix.Translation(-device.Viewport.Width / 2,
                                                 device.Viewport.Height / 2 - charSize.Height, 0);

      device.VertexFormat = CustomVertex.PositionTextured.Format;
      device.SetStreamSource(0, vb, 0);

      // microoptimization
      var emptyTexture = TexManager[' '];

      for (int y = 0; y < gridSize.Height; ++y)
      {
        for (int x = 0; x < gridSize.Width; ++x)
        {
          bool set = false;
          for (int i = 0; i < Viewports.Count; i++)
          {
            Viewport v = Viewports[i];
            if (v.CoversPoint(x, y)) // check that viewport corresponds to grid
            {
              TexManager.CurrentPreset = v.Buffer.FormatBuffer[x - v.ScreenLocation.X, y - v.ScreenLocation.Y];
              // if the buffer is in editing mode and we are over the insertion point, draw _
              if ((v.Buffer.Editing || v.ForceShowCaret) &&
                  v.Buffer.InsertionPoint.X == (x - v.ScreenLocation.X) &&
                  v.Buffer.InsertionPoint.Y == (y - v.ScreenLocation.Y))
              {
                device.SetTexture(0, TexManager['_']);
              }
              else
              {
                device.SetTexture(0, TexManager[v[x - v.ScreenLocation.X, y - v.ScreenLocation.Y]]);
              }
              set = true;
            }
          }
          if (!set)
            device.SetTexture(0, emptyTexture);
          device.DrawPrimitives(PrimitiveType.TriangleFan, 0, 4);
          device.Transform.View *= Matrix.Translation(charSize.Width, 0.0f, 0.0f);
        }
        device.Transform.View *= Matrix.Translation(-charSize.Width * gridSize.Width,
                                                    -charSize.Height, 0.0f);
      }
    }

    private void SetupMatrices()
    {
      device.Transform.World = Matrix.Identity;
      device.Transform.View = Matrix.LookAtLH(
        new Vector3(0.0f, 3.0f * distanceToObject, -5.0f * distanceToObject),
        new Vector3(0.0f, 0.0f, 0.0f),
        new Vector3(0.0f, 1.0f, 0.0f));
      device.Transform.Projection = Matrix.OrthoRH(ClientSize.Width, ClientSize.Height, -100.0f, 100.0f);
    }

    private void OnLostDevice(object sender, EventArgs e)
    {
      // if the form is not visible, i'm ignoring this
      if (!Visible)
        return;

      try
      {
        device.Reset(pp);
      }
      catch (Exception ex)
      {
        MessageBox.Show(ex.Message);
      }
    }

    private void OnResetDevice(object sender, EventArgs e)
    {
      ResetDeviceStates();
    }

    private static void OnResizeDevice(object sender, CancelEventArgs e)
    {
      e.Cancel = true;
    }

    public event EventHandler<ViewportEventArgs> ViewportClicked;

    /// <summary>
    /// Returns true so long as any console in the array is created.
    /// </summary>
    /// <param name="consoles">An array of <c>Console</c> objects.</param>
    /// <returns>true if any console is created (i.e., is running), false otherwise.</returns>
    public static bool AnyConsoleCreated(Console[] consoles)
    {
      return consoles.Any(t => t.Created);
    }

    /// <summary>
    /// Renders each of the consoles in an array.
    /// </summary>
    /// <param name="consoles">An array of <c>Console</c> objects.</param>
    public static void RenderAll(Console[] consoles)
    {
      Parallel.ForEach(consoles, c => c.Render());
    }

    public static IEnumerable<string> GetAvailableDevices()
    {
      foreach (AdapterInformation adapter in Manager.Adapters)
      {
        yield return string.Format("{0} : {1}", adapter.Adapter, adapter.Information.DeviceName);
      }
    }
  }
}