@feature:book-renaming @workflow:organise-the-books
Feature: Renaming a book

  A name typed in a hurry is a name typed wrong, and the name is the only thing
  telling one book from another. Renaming changes what it is called and nothing
  else — same recipes, same order, same ingredients.

  Background:
    Given the app is open
    And the open book is named "Dinner"
    And the contents reads:
      | Roast chicken |
      | Fish pie      |

  @rule:rename-keeps-the-todos
  Rule: Renaming changes the name and leaves the recipes alone

    Example: "Dinner" turns out to mean "Weeknights"
      Given "Fish pie" has the ingredients:
        | 400g white fish |
      When I rename the open book to "Weeknights"
      Then the open book is named "Weeknights"
      And the contents reads:
        | Roast chicken |
        | Fish pie      |
      When I open the recipe "Fish pie"
      Then "Fish pie" shows the ingredients:
        | 400g white fish |

  @rule:rename-rejects-blank
  Rule: A blank name is not a rename

    Example: submitting only spaces
      When I rename the open book to "   "
      Then the open book is named "Dinner"
