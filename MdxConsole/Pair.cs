namespace ActiveMesa.MdxConsole
{
  internal struct Pair<U, V>
  {
    // Fields
    public U First;
    public V Second;

    public Pair(U first, V second)
    {
      First = first;
      Second = second;
    }
  }
}