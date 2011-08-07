using System;
using System.Drawing;

namespace ActiveMesa.MdxConsole
{
  /// <summary>
  /// A viewport is a window into a <see cref="MdxConsole.Buffer"/>.
  /// </summary>
  public class Viewport
  {
    private Buffer buffer;
    private Point bufferLocation;
    private Point screenLocation;
    private Size size;

    /// <summary>
    /// Creates a viewport.
    /// </summary>
    /// <param name="buffer">The buffer to create a viewport for. Cannot be null.</param>
    /// <param name="size">The size of the viewport. If omitted, will match the size of the buffer.</param>
    /// <param name="bufferLocation">The location of the buffer, or (0,0) if omitted.</param>
    /// <param name="screenLocation">The location of the viewport on the console, or (0,0) if omitted.</param>
    public Viewport([NotNull] Buffer buffer, Size? size = null, Point? bufferLocation = null, Point? screenLocation = null)
    {
      Buffer = buffer;
      Size = size ?? buffer.Size;
      BufferLocation = bufferLocation ?? new Point(0,0);
      ScreenLocation = screenLocation ?? new Point(0,0);
    }

    /// <summary>
    /// The associated buffer. The buffer cannot possibly be <c>null</c> or less than the
    /// size of the viewport.
    /// </summary>
    public Buffer Buffer
    {
      get { return buffer; }
      set { buffer = value; }
    }

    public Point BufferLocation
    {
      get { return bufferLocation; }
      set
      {
        if ((value.X < 0) || (value.Y < 0))
        {
          throw new ApplicationException("Location co-ordinates must be positive.");
        }
        bufferLocation = value;
      }
    }

    /// <summary>
    /// When set, forces the renderer to show the caret even when the buffer
    /// is not in editing mode.
    /// </summary>
    public bool ForceShowCaret { get; set; }

    /// <summary>
    /// Gets or sets the <see cref="System.Char"/> with the specified x.
    /// </summary>
    /// <value></value>
    /// <remarks>The Y co-ordinate passed here is adjusted to be offset from
    /// the start point of the buffer.</remarks>
    public char this[int x, int y]
    {
      get
      {
        return Buffer[x + bufferLocation.X, 
          (Buffer.StartLine + y + bufferLocation.Y) % Buffer.Size.Height];
      }
      protected internal set
      {
        Buffer[x + bufferLocation.X, 
          (Buffer.StartLine + y + bufferLocation.Y) % Buffer.Size.Height] = value;
      }
    }

    /// <summary>
    /// 
    /// </summary>
    public Point ScreenLocation
    {
      get { return screenLocation; }
      set
      {
        if ((value.X < 0) || (value.Y < 0))
        {
          throw new ApplicationException("Location co-ordinates must be positive.");
        }
        screenLocation = value;
      }
    }

    public Size Size
    {
      get { return size; }
      set { size = value; }
    }

    /// <summary>
    /// Determines whether this viewport covers the screen point at (x, y) co-ordinates.
    /// </summary>
    /// <param name="x"></param>
    /// <param name="y"></param>
    /// <returns><c>true</c> if the point is covered, <c>false</c> otherwise.</returns>
    public bool CoversPoint(int x, int y)
    {
      return ((((x >= screenLocation.X) && (x < (screenLocation.X + size.Width))) && (y >= screenLocation.Y)) &&
              (y < (screenLocation.Y + size.Height)));
    }

    public void SetBufferFullSize(Buffer buffer)
    {
      this.buffer = buffer;
      size = buffer.Size;
      bufferLocation = new Point(0, 0);
    }
  }
}