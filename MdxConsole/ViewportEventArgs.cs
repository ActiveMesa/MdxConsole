using System;
using System.Drawing;

namespace ActiveMesa.MdxConsole
{
  public class ViewportEventArgs : EventArgs
  {
    /// <summary>
    /// The viewport that was clicked.
    /// </summary>
    public Viewport Viewport { get; set; }
    /// <summary>
    /// The viewport point.
    /// </summary>
    public Point ViewportPoint { get; set; }
  }
}