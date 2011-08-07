using System;

namespace ActiveMesa.MdxConsole
{
	public interface IExposedBuffer
	{
	  void Write(string s);
	  void Write(string s, short format);
	  void WriteLine(string s, short format);
	}
}
