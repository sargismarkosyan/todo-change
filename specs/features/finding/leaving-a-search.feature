@feature:finding-leaving @workflow:find-a-recipe
Feature: Leaving a search

  A search is where the reader is looking, not something they own. Nothing about
  it is written down, and everything that follows one puts the contents back.

  Opening a result is what searching is for, so it goes the whole way: the book
  it lives in opens, and the recipe opens in it. The alternative — a recipe read
  out of the middle of a search, with no book on screen behind it — is how the
  next thing typed lands in a book nobody knew they were in.

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

  @rule:search-opens-it-where-it-lives
  Rule: Opening a result opens the book it is in, with the recipe open in it

    Example: landing in the other book
      Given "Roast chicken" has the method:
        | Heat the oven to 200C |
      When I search for "roast"
      And I open the result "Roast chicken"
      Then the open book is named "Dinner"
      And "Roast chicken" is open
      And "Roast chicken" shows the method:
        | Heat the oven to 200C |
      And the contents reads:
        | Roast chicken |
        | Lemon chicken |
      And the search box is empty

  @rule:search-clears-back-to-the-contents
  Rule: Emptying the search puts the open book back, exactly as it was

    Example: changing my mind halfway
      Given I open the recipe "Apple cake"
      When I search for "chicken"
      And I clear the search
      Then the contents reads:
        | Apple cake    |
        | Lemon drizzle |
      And "Apple cake" is open

  @rule:search-does-not-outlast-what-follows-it
  Rule: Writing a recipe down, or switching books, ends the search

    Example: a new recipe has to be visibly there
      When I search for "chicken"
      And I write down "Bakewell tart"
      Then the search box is empty
      And the contents reads:
        | Bakewell tart |
        | Apple cake    |
        | Lemon drizzle |

    Example: another book is another contents page
      When I search for "chicken"
      And I open the book "Dinner"
      Then the search box is empty
      And the contents reads:
        | Roast chicken |
        | Lemon chicken |
