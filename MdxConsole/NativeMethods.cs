using System;
using System.Runtime.InteropServices;

namespace ActiveMesa.MdxConsole
{
  public class NativeMethods
  {
    [DllImport("user32.dll")]
    public static extern IntPtr GetSystemMenu(IntPtr hWnd, bool bRevert);
    [DllImport("user32.dll")]
    public static extern bool InsertMenu(IntPtr hMenu,
        Int32 wPosition, Int32 wFlags, Int32 wIDNewItem,
        string lpNewItem);


    public const Int32 WM_SYSCOMMAND = 0x112;
    public const Int32 MF_SEPARATOR = 0x800;
    public const Int32 MF_BYCOMMAND = 0x00000000;
    public const Int32 MF_BYPOSITION = 0x400;
    public const Int32 MF_STRING = 0x0;
    public const Int32 IDM_CUSTOMITEM1 = 1000;
    public const Int32 IDM_CUSTOMITEM2 = 1001;
  }
}