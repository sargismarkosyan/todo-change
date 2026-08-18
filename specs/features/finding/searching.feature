@feature:finding-searching
Feature: Finding a recipe in any book

  A book exists so there is less to read down at once, and the price of that is
  a recipe you cannot place: it is in one of them, and finding it means opening
  each in turn until it turns up. Searching is the way back — one box, every
  book, and the name of the book beside everything it finds.

  This is the only thing in the app that reaches past the open book, which is
  why a result carries the book it is in: "regardless of which book" is only an
  answer if it says which book.

  A search matches what a recipe is recognised by — its name, and what it takes.
  Not the method: "oven" would match nearly everything baked, and a step is the
  part read after deciding rather than the part something is remembered by.

  Results sit in the order the books sit in, then the order each contents sits
  in. Nothing is ranked, because nothing in this app rearranges itself.

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
      | Lemon chicken |

  @rule:search-reaches-every-book
  Rule: A search looks in every book, and each result says which one it is in

    Example: one word, two books
      When I search for "lemon"
      Then the results read:
        | Lemon drizzle | Sweets |
        | Lemon chicken | Dinner |

    Example: finding something that is not in the open book
      When I search for "roast"
      Then the results read:
        | Roast chicken | Dinner |

    Example: it does not matter how it was typed
      When I search for "APPLE"
      Then the results read:
        | Apple cake | Sweets |

  @rule:search-matches-what-it-takes
  Rule: A recipe matches on its ingredients too, and the result shows the one that matched

    Example: the recipe with the flour in it
      Given "Apple cake" has the ingredients:
        | 200g plain flour |
        | 3 apples         |
      And "Lemon chicken" has the ingredients:
        | 2 lemons |
      When I search for "flour"
      Then the results read:
        | Apple cake | Sweets |
      And the result "Apple cake" shows the line "200g plain flour"

    Example: a match on the name shows no line
      When I search for "apple"
      Then the results read:
        | Apple cake | Sweets |
      And the result "Apple cake" shows no line

  @rule:search-finds-nothing
  Rule: A search matching nothing says so, and says nothing about the book

    Example: looking for something never written down
      When I search for "paella"
      Then the results are empty
      And I see the message "No recipe matches that."
      And I do not see the message "No recipes in this book yet."
