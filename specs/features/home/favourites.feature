@feature:home-favourites @workflow:find-a-recipe
Feature: The usual ones, at the front door

  The picks answer "I have nothing in mind". **The favourites answer the other
  half of the same moment**: I know roughly what, it is one of the four things I
  actually cook, and I should not have to remember which book it is in or spell
  it correctly to get there.

  So they lead the home — above the picks, each naming the book it is in, opened
  the same way a pick is. The picks stay underneath and keep doing the one thing
  nothing else does: reaching into a book nobody has opened since March. They
  simply stop offering something already on screen a few lines up.

  With nothing starred this is the home exactly as version 0013 shipped it: no
  heading, no empty group, no message about favourites. The front door of a fresh
  install is not the place to advertise a feature nobody has used yet.

  Background:
    Given the books are:
      | Sweets |
      | Dinner |
    And the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
      | Bakewell tart |
    And the book "Dinner" holds:
      | Roast chicken      |
      | Lemon chicken      |
      | Thursday casserole |

  @rule:favourites-lead-the-home
  Rule: Starred recipes lead the home, naming their book, and open where they live

    Example: what gets cooked most weeks, at the front door
      Given "Apple cake" is a favourite
      And "Roast chicken" is a favourite
      When the app is opened at the home
      Then the favourites read:
        | Apple cake    | Sweets |
        | Roast chicken | Dinner |
      And the favourites come before the picks

    Example: starting from one
      Given "Roast chicken" is a favourite
      And "Roast chicken" has the method:
        | Heat the oven to 200C |
      And the app is opened at the home
      When I open the favourite "Roast chicken"
      Then the address names the book "Dinner"
      And the masthead names the book "Dinner"
      And "Roast chicken" is open
      And "Roast chicken" shows the method:
        | Heat the oven to 200C |

    Example: one that has since been deleted is not offered
      Given "Apple cake" is a favourite
      And "Roast chicken" is a favourite
      And I delete the recipe "Apple cake"
      When the app is opened at the home
      Then the favourites read:
        | Roast chicken | Dinner |

  @rule:the-picks-do-not-repeat-a-favourite
  Rule: The picks offer something else, never a recipe already starred above them

    Example: three picks, none of them a favourite
      Given "Apple cake" is a favourite
      And "Roast chicken" is a favourite
      When the app is opened at the home
      Then there are three picks
      And no pick is a favourite

    Example: everything written down is a favourite
      Given every recipe is a favourite
      When the app is opened at the home
      Then there are no picks
      And the favourites are on screen
      And I do not see the message "Nothing written down yet."

  @rule:nothing-starred-is-the-home-as-it-was
  Rule: With nothing starred the home is the search box and the picks, as before

    Example: a book nobody has starred anything in
      When the app is opened at the home
      Then there are no favourites on screen
      And there are three picks

    Example: unstarring the last one puts the home back
      Given "Apple cake" is a favourite
      And the app is opened at the book "Sweets"
      When I star the recipe "Apple cake"
      And I go to the home
      Then there are no favourites on screen
      And there are three picks

  @rule:a-search-covers-the-favourites-too
  Rule: Searching replaces both, and clearing puts both back unchanged

    Example: typing, then changing my mind
      Given the day is "2026-08-21"
      And "Apple cake" is a favourite
      And the app is opened at the home
      When I search for "lemon"
      Then the results read:
        | Lemon drizzle | Sweets |
        | Lemon chicken | Dinner |
      And there are no favourites on screen
      And there are no picks
      When I clear the search
      Then the favourites read:
        | Apple cake | Sweets |
      And the picks read the same three as before
