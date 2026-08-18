@feature:recipe-tags
Feature: What a recipe is found by

  A tag is one word a recipe can be found by — chicken, lemon, slow. It sits
  under the recipe's name, on the card as much as on the open recipe, because
  being readable without opening anything is the whole of what it is for.

  A tag is not an ingredient, and neither is read out of the other. An
  ingredient is a line written the way it is said out loud — "2 free-range
  chicken thighs" — and it stays exactly that line. A tag is the word you would
  go looking with. Deriving one from the other is the parser that
  `spec.md` refuses to grow, and it would be wrong quietly.

  An ingredient is a line with an id of its own; a tag has none. The word is the
  tag, the same word anywhere is the same tag, and that is the only reason
  filtering by one means anything. So a tag is lower case and a recipe holds
  each one once — "Chicken" and "chicken" would otherwise be two doors, each
  opening onto half the answer.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple cake    |
      | Lemon drizzle |
    And I open the recipe "Apple cake"

  @planned @rule:tag-added-to-recipe
  Rule: A tag is typed into the open recipe and appears under its name

    Example: the first word to go looking with
      When I add the tag "apple" to "Apple cake"
      Then "Apple cake" has the tags:
        | apple |

    Example: several, in the order they were typed
      When I add the tag "apple" to "Apple cake"
      And I add the tag "cake" to "Apple cake"
      Then "Apple cake" has the tags:
        | apple |
        | cake  |

    Example: tagging does not move the recipe in the contents
      When I add the tag "apple" to "Apple cake"
      Then the contents reads:
        | Apple cake    |
        | Lemon drizzle |

  @planned @rule:a-tag-is-a-word-not-a-line
  Rule: A tag is trimmed and lower case, and a recipe holds each one once

    Example: typed with a capital
      When I add the tag "Apple" to "Apple cake"
      Then "Apple cake" has the tags:
        | apple |

    Example: the same word twice
      When I add the tag "apple" to "Apple cake"
      And I add the tag "APPLE " to "Apple cake"
      Then "Apple cake" has the tags:
        | apple |

    Example: blank text is not a word
      When I submit "   " as a tag of "Apple cake"
      Then "Apple cake" has no tags

  @planned @rule:tags-show-on-the-card
  Rule: A closed recipe shows its tags, and nothing else of itself

    Example: reading the contents without opening anything
      Given "Apple cake" has the tags:
        | apple |
        | cake  |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
      When I close the recipe "Apple cake"
      Then "Apple cake" is closed
      And "Apple cake" has the tags:
        | apple |
        | cake  |
      And "Apple cake" shows no ingredients
      And "Apple cake" shows no method

    Example: an untagged recipe is still only its name
      Then "Lemon drizzle" is closed
      And "Lemon drizzle" has no tags

  @planned @rule:tag-removed-from-recipe
  Rule: A tag is taken off the open recipe, and only there

    Example: the wrong word
      Given "Apple cake" has the tags:
        | apple |
        | pear  |
      When I remove the tag "pear" from "Apple cake"
      Then "Apple cake" has the tags:
        | apple |

    Example: the contents is for reading, not editing
      Given "Lemon drizzle" has the tags:
        | lemon |
      Then "Lemon drizzle" is closed
      And "Lemon drizzle" offers no way to remove a tag
