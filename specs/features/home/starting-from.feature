@feature:home-picks
Feature: Somewhere to start from

  A front door with an empty search box and nothing under it is a dead end: it
  answers the person who already knows what they want, and this is the moment
  they do not. **The picks** are what fills it — three recipes, from across every
  book, each saying which book it is in.

  They are picked from the date and nothing else, so they hold still all day. A
  page that reshuffles itself on every keystroke would be the one thing this app
  has never done, and the home repaints on every letter typed into the search
  box.

  Arbitrary, and deliberately so. Not the most popular — one person and no
  backend means popularity could only be counted from what they open, and that
  is a usage record this app has never kept. Not ranked, not inferred, not
  "because you liked". The value is reaching into a book nobody has opened since
  March, which arbitrary does perfectly well.

  Background:
    Given the books are:
      | Sweets |
      | Dinner |
    And the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
      | Bakewell tart |
    And the book "Dinner" holds:
      | Roast chicken |
      | Lemon chicken |
      | Thursday casserole |

  @planned
  @rule:picks-reach-every-book
  Rule: Three recipes, from any book, each naming the book it is in

    Example: three to start from
      Given the app is opened at the home
      Then there are three picks
      And every pick is a recipe in one of the books
      And every pick names the book it is in

    Example: the book last open is not left out
      Given the open book is named "Sweets"
      And the book "Dinner" is empty
      And the book "Sweets" holds:
        | Apple cake |
      When the app is opened at the home
      Then the picks read:
        | Apple cake | Sweets |

  @planned
  @rule:picks-hold-still-all-day
  Rule: The same day gives the same three, and not every day the same

    Example: opened twice before lunch
      Given the day is "2026-08-19"
      When the app is opened at the home
      And the app is opened at the home again
      Then both times the picks read the same three

    Example: it is not the same three every day
      When the app is opened at the home on each day of one week
      Then more than one set of three came up

  @planned
  @rule:picks-open-where-they-live
  Rule: Opening a pick opens the book it is in, with the recipe open in it

    Example: starting from one
      Given "Roast chicken" has the method:
        | Heat the oven to 200C |
      And the app is opened at the home
      When I open the pick "Roast chicken"
      Then the address names the book "Dinner"
      And the masthead names the book "Dinner"
      And "Roast chicken" is open
      And "Roast chicken" shows the method:
        | Heat the oven to 200C |

  @planned
  @rule:picks-give-what-there-is
  Rule: Fewer than three written down shows what there is, and none says so

    Example: two recipes altogether
      Given the book "Sweets" holds:
        | Apple cake |
      And the book "Dinner" holds:
        | Roast chicken |
      When the app is opened at the home
      Then the picks read:
        | Apple cake    | Sweets |
        | Roast chicken | Dinner |

    Example: nothing written down anywhere yet
      Given every book is empty
      When the app is opened at the home
      Then there are no picks
      And I see the message "Nothing written down yet."
      And I do not see the message "No recipes in this book yet."

  @planned
  @rule:picks-step-aside-for-the-results
  Rule: Searching puts results in their place, and clearing puts them back unchanged

    Example: typing, then changing my mind
      Given the day is "2026-08-19"
      And the app is opened at the home
      When I search for "lemon"
      Then the results read:
        | Lemon drizzle | Sweets |
        | Lemon chicken | Dinner |
      And there are no picks
      When I clear the search
      Then the picks read the same three as before
