@feature:recipe-reading
Feature: Opening a recipe to read it

  A book is a page of names until one of them is opened. That page is the
  contents, and it is what makes a book browsable: you run your eye down it,
  find the one you want, and open it.

  An open recipe shows what it takes and then what to do, in that order, because
  the ingredients are what you read before deciding and the method is what you
  read once you have.

  One recipe is open at a time. A book with every recipe open at once is a wall
  of text with no contents page, which is the thing a book has and a list does
  not.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple cake    |
      | Lemon drizzle |

  @planned
  @rule:recipe-opens-to-be-read
  Rule: Opening a recipe shows its ingredients, and its method under them

    Example: looking up the apple cake
      Given "Apple cake" has the ingredients:
        | 200g plain flour |
        | 3 apples         |
      And "Apple cake" has the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
      When I open the recipe "Apple cake"
      Then "Apple cake" is open
      And "Apple cake" shows the ingredients:
        | 200g plain flour |
        | 3 apples         |
      And "Apple cake" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
      And the ingredients come before the method

    Example: a closed recipe is only its name
      Given "Lemon drizzle" has the ingredients:
        | 2 lemons |
      Then "Lemon drizzle" is closed
      And "Lemon drizzle" shows no ingredients
      And "Lemon drizzle" shows no method

  @planned
  @rule:one-recipe-open-at-a-time
  Rule: Opening a recipe closes the one that was open

    Example: changing your mind at the contents
      Given I open the recipe "Apple cake"
      When I open the recipe "Lemon drizzle"
      Then "Lemon drizzle" is open
      And "Apple cake" is closed

    Example: closing the one you opened leaves the contents whole
      Given I open the recipe "Apple cake"
      When I close the recipe "Apple cake"
      Then "Apple cake" is closed
      And the contents reads:
        | Apple cake    |
        | Lemon drizzle |

  @planned
  @rule:nothing-is-ticked-off
  Rule: Nothing in a book can be ticked off

    Example: a recipe is kept, not finished
      When I open the recipe "Apple cake"
      Then "Apple cake" offers no way to tick it off
      And nothing on screen offers a tick box
