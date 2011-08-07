using System;
using System.Diagnostics;
using System.Drawing;
using System.Text;
using System.Threading;

namespace ActiveMesa.MdxConsole
{
  /// <summary>
  /// A console buffer.
  /// </summary>
  public class Buffer
  {
    #region Fields

    private readonly short[,] formatBuffer;
    private readonly ReaderWriterLockSlim syncRoot = new ReaderWriterLockSlim(LockRecursionPolicy.SupportsRecursion);
    private bool full;
    private Point insertionPoint = new Point(0, 0);
    private Size size;
    private char[,] textBuffer;

    /// <summary>
    /// Gets the insertion line. The reason to return it is so that the console knows
    /// which line to begin rendering at.
    /// </summary>
    /// <value>The insertion line.</value>
    public int InsertionLine
    {
      get
      {
        return insertionPoint.Y;
      }
    }

    /// <summary>
    /// Gets the index of the starting line.
    /// </summary>
    /// <value>The start line.</value>
    public int StartLine
    {
      get { return full ? (insertionPoint.Y + 1) % size.Height : 0; }
    }

    #endregion

    #region Constructors

    /// <summary>
    /// Creates a zero-sized console buffer. Probably not a good idea since a
    /// zero-sized buffer cannot actually store anything.
    /// </summary>
    public Buffer() : this(0, 0)
    {
    }

    /// <summary>
    /// Creates a buffer with the corresponding width and height. Note that the buffer is
    /// not the visible area, but rather the total amount of rows and columns stored.
    /// Therefore, you can make the buffer as high as you can, and the viewport will simply
    /// scroll.
    /// </summary>
    /// <param name="width">The width.</param>
    /// <param name="height">The height.</param>
    public Buffer(int width, int height) : this(new Size(width, height))
    {
    }

    /// <summary>
    /// Creates a buffer with the corresponding width and height. Note that the buffer is
    /// not the visible area, but rather the total amount of rows and columns stored.
    /// Therefore, you can make the buffer as high as you can, and the viewport will simply
    /// scroll.
    /// </summary>
    /// <param name="size">The size of the buffer.</param>
    public Buffer(Size size)
    {
      this.size = size;
      textBuffer = new char[size.Width,size.Height];
      formatBuffer = new short[size.Width,size.Height];
      Fill(' ');
    }

    #endregion

    #region Properties

    /// <summary>
    /// Gets or sets the insertion point. The insertion point is the location in the
    /// buffer at which the next character will be written. The insertion point is used
    /// for writing new text, including text that is being typed by the user.
    /// </summary>
    /// <value>The insertion point.</value>
    public Point InsertionPoint
    {
      get { return insertionPoint; }
      private set { insertionPoint = value; }
    }

    /// <summary>
    /// The size of the buffer. If you resize the buffer, the contents of the
    /// buffer get wiped before resizing.
    /// </summary>
    public Size Size
    {
      get { return size; }
      set
      {
        syncRoot.EnterWriteLock();
        size = value;
        textBuffer = new char[value.Width,value.Height];
        syncRoot.ExitWriteLock();
      }
    }

    /// <summary>
    /// A flag to indicate whether the buffer is full and is thus overflowing.
    /// </summary>
    public bool Full
    {
      get { return full; }
      set { full = value; }
    }

    /// <summary>
    /// Gets or sets a value indicating whether the buffer is being edited.
    /// </summary>
    public bool Editing { get; set; }

    public short[,] FormatBuffer
    {
      get { return formatBuffer; }
    }

    /// <summary>
    /// Returns an element of the console buffer.
    /// </summary>
    /// <param name="x">X co-ordinate of the character to get.</param>
    /// <param name="y">Y co-ordinate of the character to get.</param>
    /// <returns>The character at the specified location.</returns>
    /// <remarks>Write lock is taken. Accessing this too much is a bad idea.</remarks>
    public char this[int x, int y]
    {
      get
      {
        syncRoot.EnterReadLock();
#if DEBUG
        if (x >= textBuffer.GetLength(0) || y >= textBuffer.GetLength(1))
          throw new ArgumentException(
            string.Format("Tried to access location ({0},{1}) in a {2}x{3} buffer.", x, y,
                          textBuffer.GetLength(0), textBuffer.GetLength(1)));

        if (x < 0 || y < 0)
          throw new ArgumentException(
            string.Format("Attempted to access location ({0}, {1}) which has a negative co-ordinate", x, y));
#endif
        char c = textBuffer[x, y];
        syncRoot.ExitReadLock();
        return c;
      }

      protected internal set
      {
        syncRoot.EnterWriteLock();
        textBuffer[x, y] = value;
        syncRoot.ExitWriteLock();
      }
    }

    #endregion

    #region Methods
    
    public void Backspace()
    {
      if (insertionPoint.Y >= 0 || Full)
      {
        insertionPoint.X--;
        if (insertionPoint.X < 0)
        {
          insertionPoint.X = size.Width - 1;
          insertionPoint.Y--;
        }
        syncRoot.EnterWriteLock();
        textBuffer[insertionPoint.X, insertionPoint.Y] = ' ';
        syncRoot.ExitWriteLock();
      }
    }
    
    public void WriteLine(string s, short format = 0)
    {
      Write(s + '\n');
    }

    /// <summary>
    /// Same as <c>WriteLine</c>, but the line break comes first.
    /// This is useful for utilizing the last line
    /// </summary>
    public void LineWrite(string s, short format = 0)
    {
      Write('\n' + s);
    }

    /// <summary>
    /// Writes text to the buffer.
    /// </summary>
    /// <param name="s">The string to write</param>
    
    public void Write(string s)
    {
      Write(s, 0);
    }

    /// <summary>
    /// Writes text to the buffer.
    /// </summary>
    /// <param name="s">The string to write</param>
    /// <param name="format">The index of the text format to use.</param>
    public void Write(string s, short format)
    {
      Debug.WriteLine("Write(s,format)");
      if (string.IsNullOrEmpty(s))
        return;

      // break on every newline
      var buffer = new StringBuilder(s.Length);
      for (int i = 0; i < s.Length; ++i)
      {
        // ignore \r completely
        if (s[i] == '\r')
          continue;
        
        if (s[i] == '\n')
        {
          // if buffer not empty, write it
          string buf = buffer.ToString();
          if (buf.Length > 0)
          {
            InternalWrite(buf, format);
            buffer = new StringBuilder();
          }
          // now break
          Return();
        } else
        {
          // just append the character
          buffer.Append(s[i]);
        }
      }
      // if something left in buffer, write it!
      string b = buffer.ToString();
      if (b.Length > 0)
        InternalWrite(b, format);
    }

    
    protected void InternalWrite(string s, short format)
    {
      Debug.WriteLine(string.Format("InternalWrite('{0}',format)", s));
      syncRoot.EnterWriteLock();
      int len = s.Length;

      // if line is empty, ignore it
      if (len == 0)
        return;

      // check amount of available space
      int availSpace = size.Width - insertionPoint.X;
      if (availSpace >= len)
      {
        // simple - just copy over the space and adjust the insertion pointer
        for (int x = 0; x < len; ++x)
        {
          textBuffer[x + insertionPoint.X, insertionPoint.Y] = s[x];
          FormatBuffer[x + insertionPoint.X, insertionPoint.Y] = format;
        }
        // insertion point is adjusted depending on whether EOL reached or not
        if (availSpace == len)
        {
          Return();
        }
        else
        {
          insertionPoint.X += len;
        }
      }
      else
      {
        // determine if we can break on a word
        // that said, if a line consists of spaces, this isn't the best option
        int spacePos = s.LastIndexOf(' ', availSpace, availSpace);
        if (spacePos != -1 && s.Trim().Length != 0)
        {
          // yes we can. so, write the line, break it, and repeat the process
          string line = s.Substring(0, spacePos);
          for (int x = 0; x < line.Length; ++x)
          {
            textBuffer[x + insertionPoint.X, insertionPoint.Y] = line[x];
            FormatBuffer[x + insertionPoint.X, insertionPoint.Y] = format;
          }
          // make a break
          Return();
          // double-check that we didn't get a line ending in a space
          if (s.Length != line.Length + 1)
          {
            InternalWrite(s.Substring(spacePos + 1), format);
          }
        }
        else
        {
          // no, we cannot => write the text 'as is' and break what's left
          string line = s.Substring(0, availSpace);
          for (int x = 0; x < line.Length; ++x)
          {
            textBuffer[x + insertionPoint.X, insertionPoint.Y] = line[x];
            FormatBuffer[x + insertionPoint.X, insertionPoint.Y] = format;
          }
          Return();
          InternalWrite(s.Substring(availSpace), format);
        }
      }

      syncRoot.ExitWriteLock();
    }

    /// <summary>
    /// Fills the whole buffer with the specified character.
    /// </summary>
    /// <param name="c">Character to fill the buffer with.</param>
    
    public void Fill(char c)
    {
      Fill(c, 0);
    }

    /// <summary>
    /// Fills the whole buffer with the specified character.
    /// </summary>
    /// <param name="c">Character to fill the buffer with.</param>
    /// <param name="format">The formatting for the character.</param>
    
    public void Fill(char c, short format)
    {
      syncRoot.EnterWriteLock();
      for (int a = 0; a < size.Width; ++a)
        for (int b = 0; b < size.Height; ++b)
          textBuffer[a, b] = c;
      syncRoot.ExitWriteLock();
    }


    private void FillLine(char c, int line, short format = 0)
    {
      // if the line isn't here, ignore it
      if (line < 0 || line >= size.Height)
        return;
      
      syncRoot.EnterWriteLock();
      for (int a = 0; a < size.Width; ++a)
      {
        textBuffer[a, line] = c;
        formatBuffer[a, line] = format;
      }
      syncRoot.ExitWriteLock();
    }

    
    private void Return()
    {
      insertionPoint.X = 0;
      ++insertionPoint.Y;
      // if you did a line break on an overflow, the next line is dirty
      if (full)
        FillLine(' ', insertionPoint.Y);
      // if this caused a move to the last line, wrap around and set Y to 0
      if (insertionPoint.Y == size.Height)
      {
        full = true;
        insertionPoint.Y = 0;
        FillLine(' ', insertionPoint.Y);
      }
    }

    
    public override string ToString()
    {
      var sb = new StringBuilder();
      try
      {
        syncRoot.EnterReadLock();
        for (int row = 0; row < size.Height; ++row)
        {
          sb.Append("Row " + row + ": [ ");
          for (int col = 0; col < size.Width; ++col)
          {
            sb.Append("<" + textBuffer[col, row] + ">");
            if (col + 1 != size.Width)
              sb.Append(", ");
          }
          sb.AppendLine(" ]");
        }
        syncRoot.ExitReadLock();
      }
      catch (Exception ex)
      {
        sb.AppendLine(ex.ToString());
      }
      return sb.ToString();
    }

    #endregion

    /// <summary>
    /// Creates a <see href="Buffer"/> object of size matching the provided console.
    /// </summary>
    /// <param name="console">The console whose size is taken as reference.</param>
    /// <returns>A newly-created buffer.</returns>
    /// <param name="charHeight">Height of a character.</param>
    /// <param name="charWidth">Width of a character.</param>
    public static Buffer NewBuffer(Console console, int charWidth, int charHeight)
    {
      var buffer = new Buffer((int)Math.Floor((double)console.Width / charWidth),
                              (int)Math.Floor((double)console.Height / charHeight));
      return buffer;
    }
  }
}