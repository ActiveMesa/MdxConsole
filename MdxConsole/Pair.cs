namespace Nesteruk.MdxConsole
{
  internal sealed class Pair<U, V>
  {
    // Fields
    public U First;
    public V Second;

    // Methods
    public Pair()
    {
      First = default(U);
      Second = default(V);
    }

    public Pair(U first, V second)
    {
      First = first;
      Second = second;
    }
  }
}