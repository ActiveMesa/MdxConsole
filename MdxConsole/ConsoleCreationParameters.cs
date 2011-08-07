using System.Drawing;

namespace ActiveMesa.MdxConsole
{
  /// <summary>
  /// Parameters that define the way the console is created.
  /// </summary>
  public class ConsoleCreationParameters
  {
    /// <summary>
    /// If set, forces the window to be created with a specific size.
    /// Useful for taking perfectly sized screenshots and the like.
    /// </summary>
    public Size? ClientSize;
    /// <summary>
    /// Pixel width of a single character.
    /// </summary>
    public int CharacterWidth = 10;
    public int CharacterHeight = 14;
    /// <summary>
    /// Number of characters that fit horizontally in the console.
    /// </summary>
    public int Width = 20;
    public int Height = 30;
    /// <summary>
    /// Whether or not the console should take up the whole screen.
    /// </summary>
    public bool FullScreen;
    /// <summary>
    /// Whether or not the console should get a default view and buffer with
    /// matching sizes.
    /// </summary>
    /// <value><c>true</c> by default</value>
    public bool CreateDefaultViewAndBuffer = true;
  }
}