@feature:finding-leaving-filter
Feature: Leaving a filter

  A filter is a way of looking, exactly as a search is. Nothing about it is
  written down, and everything that follows one puts the contents back.

  There are now two ways of looking past the open book, and they replace each
  other rather than combining. A search is a word remembered about one recipe; a
  filter is what several recipes have in common. Both at once would need the
  screen to explain which of them is doing the narrowing, and this app has one
  page and no room to explain anything.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the open book is named "Sweets"
    And the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
    And the book "Dinner" holds:
      | Roast chicken |
    And "Roast chicken" has the tags:
      | chicken |

  @rule:filter-opens-it-where-it-lives
  Rule: Opening a result opens the book it is in, with the recipe open in it

    Example: landing in the other book
      Given "Roast chicken" has the method:
        | Heat the oven to 200C |
      When I pick the tag "chicken"
      And I open the result "Roast chicken"
      Then the open book is named "Dinner"
      And "Roast chicken" is open
      And "Roast chicken" shows the method:
        | Heat the oven to 200C |
      And no tags are picked
      And the contents reads:
        | Roast chicken |

  @rule:one-way-of-looking-at-a-time
  Rule: A search and a filter replace each other, and neither outlasts what follows it

    Example: picking a tag puts the search away
      When I search for "lemon"
      And I pick the tag "chicken"
      Then the search box is empty
      And the results read:
        | Roast chicken | Dinner |

    Example: searching puts the picked tags away
      When I pick the tag "chicken"
      And I search for "lemon"
      Then no tags are picked
      And the results read:
        | Lemon drizzle | Sweets |

    Example: a new recipe has to be visibly there
      When I pick the tag "chicken"
      And I write down "Bakewell tart"
      Then no tags are picked
      And the contents reads:
        | Bakewell tart |
        | Apple cake    |
        | Lemon drizzle |

    Example: another book is another contents page
      When I pick the tag "chicken"
      And I open the book "Dinner"
      Then no tags are picked
      And the contents reads:
        | Roast chicken |
