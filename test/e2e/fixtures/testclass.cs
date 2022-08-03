using System;

public class TestClass
{
    public void PrintGreeting( string name, int age )
    {
        Console.WriteLine( _( "Welcome, {0}!", name ) );
        Console.WriteLine( _n( "You are {0} year old.", "You are {0} years old.", age, age ) );
    }

    public void PrintFruits( int count )
    {
        Console.WriteLine( _p( "fruits", "I like apples." ) );
        Console.WriteLine( _pn( "fruits", "I have one apple.", "I have {0} apples.", count, count ) );
    }
}
