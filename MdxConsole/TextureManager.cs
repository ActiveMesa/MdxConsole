using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;
using System.Linq;
using Microsoft.DirectX.Direct3D;
using TextPreset = System.Tuple<System.Drawing.Font,System.Drawing.Color,System.Drawing.Color>;

namespace ActiveMesa.MdxConsole
{
  public class TexturePreset
  {
    public Texture[] Textures;
    public int Scale = 1;
  }

  /// <summary>
  /// This class manages textures used for rendering the console.
  /// It is created as a property of the <c>Console</c> class.
  /// </summary>
  public class TextureManager : IDisposable
  {
    private readonly Device device;
    private readonly List<Texture[]> presets = new List<Texture[]>();
    private short charCount = 256;
    private Size charSize;
    private int currentPreset;
    private Font defaultFont;

    public TextureManager(Device device, int charWidth = 10, int charHeight = 14)
    {
      if (device == null)
        throw new ArgumentNullException("device");
      if (charWidth <= 0 || charHeight <= 0)
        throw new ArgumentException("Character size must be positive.");

      this.device = device;
      charSize = new Size(charWidth, charHeight);
      // make sure that at least something is available
      float fontSize = (int)Math.Floor(charHeight / 14.0f * 9.0f);
      defaultFont = new Font("Consolas", fontSize);
      CurrentPreset = AddPreset(defaultFont, Color.Transparent, Color.White);
    }

    /// <summary>
    /// The number of characters to create for each preset.
    /// </summary>
    public short CharCount
    {
      get { return charCount; }
      set
      {
        if (value <= 0)
          throw new ApplicationException("You must specify a positive number of characters.");
        charCount = value;
      }
    }

    /// <summary>
    /// Gets the default font.
    /// </summary>
    /// <value>The default font.</value>
    public Font DefaultFont
    {
      get
      {
        return defaultFont;
      }
      set
      {
        defaultFont = value;
      }
    }

    public int CurrentPreset
    {
      get { return currentPreset; }
      set
      {
        if (value >= presets.Count)
          throw new ApplicationException(string.Format("No such preset '{0}'.", value));
        currentPreset = value;
      }
    }

    public Texture this[int letter]
    {
      get { return presets[CurrentPreset][letter]; }
    }

    #region Methods

    public void Dispose()
    {
      foreach (var t in presets.SelectMany(p => p))
        t.Dispose();
    }

    /// <summary>
    /// Adds a new preset.
    /// </summary>
    /// <param name="font">Font.</param>
    /// <param name="bgColor">Background color.</param>
    /// <param name="fgColor">Foreground color.</param>
    /// <returns>Preset index.</returns>
    public short AddPreset(Font font, Color bgColor, Color fgColor)
    {
      // create textures for each individual character
      var textures = new Texture[charCount];
      using (var bmp = new Bitmap(charSize.Width, charSize.Height, PixelFormat.Format32bppArgb))
      using (Graphics g = Graphics.FromImage(bmp))
      using (Brush brush = new SolidBrush(fgColor))
      using (var ms = new MemoryStream())
        for (int i = 0; i < CharCount; ++i)
        {
          g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
          g.Clear(bgColor);
          g.DrawString(string.Format("{0}", (char) i), font, brush, 0.0f, 0.0f);

          // save bmp to buffer and read from it
          bmp.Save(ms, ImageFormat.Bmp);

          Texture t = Texture.FromStream(device, ms, 0, Pool.Managed);
          Debug.Assert(t != null);
          textures[i] = t;
        }
      presets.Add(textures);
      return (short) (presets.Count - 1);
    }
    /// <summary>
    /// Adds a predefined preset. Use the <c>TextureManager.Presets</c> class
    /// for some ready-made presets.
    /// </summary>
    /// <param name="preset"></param>
    /// <returns></returns>
    public short AddPreset(TextPreset preset)
    {
      return AddPreset(preset.Item1, preset.Item2, preset.Item3);
    }

    #endregion
  }
}