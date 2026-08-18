@feature:finding-filtering
Feature: Finding a recipe by what it takes

  Searching answers "where did I put that recipe". This answers the other
  question, the one asked at an open fridge: "what can I make with this". There
  is no recipe in mind to search for, so there is nothing to type — which is why
  the tags that exist are shown to be picked from rather than guessed at. You
  cannot type a word you have not thought of, but you can read one off a list.

  Picking more than one narrows: chicken and lemon means recipes that take
  both, not either. A fridge holds several things and the question is what they
  add up to.

  Like a search this reaches every book, and every result says which book it is
  in. Unlike a search it matches the tag whole — "ice" finds nothing unless
  something is tagged ice, where searching the ingredients would have offered
  every rice and every juice.

  The tags on offer sit in alphabetical order. It is the one order that does not
  move as tagging goes on: by how often each is used, the list would rearrange
  itself under the cursor every time a recipe was tagged.

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
    And "Lemon drizzle" has the tags:
      | lemon |
    And "Roast chicken" has the tags:
      | chicken |
    And "Lemon chicken" has the tags:
      | chicken |
      | lemon   |

  @rule:filter-reaches-every-book
  Rule: Picking a tag shows every recipe carrying it, in every book

    Example: what takes chicken
      When I pick the tag "chicken"
      Then the results read:
        | Roast chicken | Dinner |
        | Lemon chicken | Dinner |

    Example: an answer from a book that is not open
      When I pick the tag "lemon"
      Then the results read:
        | Lemon drizzle | Sweets |
        | Lemon chicken | Dinner |

    Example: an untagged recipe is not an answer
      When I pick the tag "lemon"
      Then the results do not include "Apple cake"

  @rule:filter-combines-tags
  Rule: Picking a second tag narrows to what carries both

    Example: chicken and lemon
      When I pick the tag "chicken"
      And I pick the tag "lemon"
      Then the results read:
        | Lemon chicken | Dinner |

    Example: putting one back
      When I pick the tag "chicken"
      And I pick the tag "lemon"
      And I unpick the tag "lemon"
      Then the results read:
        | Roast chicken | Dinner |
        | Lemon chicken | Dinner |

  @rule:filter-finds-nothing
  Rule: Nothing carrying all of them says so, and keeps the picked tags on screen

    Example: two words that never meet
      Given "Apple cake" has the tags:
        | apple |
      When I pick the tag "apple"
      And I pick the tag "chicken"
      Then the results are empty
      And I see the message "No recipe takes all of those."
      And I do not see the message "No recipes in this book yet."
      And the picked tags read:
        | apple   |
        | chicken |

  @rule:filter-offers-only-tags-in-use
  Rule: The tag box offers the tags that are in use, and is not there when none are

    Example: every tag, from every book, in alphabetical order
      When I open the tag box
      Then the tags offered read:
        | chicken |
        | lemon   |

    Example: typing narrows the offer
      When I type "lem" into the tag box
      Then the tags offered read:
        | lemon |

    Example: nothing tagged anywhere means nothing to pick from
      Given no recipe has any tags
      Then there is no tag box
