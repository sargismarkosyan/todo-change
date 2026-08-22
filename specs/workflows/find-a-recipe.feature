@workflow:find-a-recipe @persona:nell @journey:keeping-what-you-cook
Feature: Find a recipe

  When I am at the fridge deciding what to make, or I want one particular
  recipe and cannot remember which book it is in,
  I want the recipe open in front of me,
  so I can start cooking instead of hunting.

  **Ends when** the recipe is open. One attempt, three entry points, and which
  one is used depends only on how much is already known.

  **Nothing in mind at all — the home.** Opening a book already assumes an
  answer: which book, and therefore roughly what for. The home is the version
  with no assumption in it — three picks from any book, each saying which book
  it is in, arrived at by opening the app and nothing else. It reaches into a
  book nobody has opened since March, which is the one thing neither browsing
  nor searching does.

  **One of the usual — the favourites.** Most of what gets cooked comes from a
  handful of recipes. Since 0014 those are starred in their books and lead the
  home: open the app and they are the first thing on it. No book to remember
  and no name to spell — the two kinds of recall this workflow otherwise
  charges. Nobody is asked to star anything, and a browser that never has sees
  the home 0013 shipped.

  **A book in mind — the contents.** Open a book, read the names down in one
  pass, open one. The name of the open book is on screen throughout, because
  that is what says which book is being looked at. Since 0015 the ribbon says it
  without being read, which is what makes *"show me the other book"* a thing you
  point at rather than a list of names you read.

  **A name in mind but not a book — the search.** Type part of the name, or part
  of something it takes; read the matches, each saying which book it is in; open
  it and land in that book with it open. This is the one thing in the app that
  reaches past the open book.

  **Where it breaks.** Every recipe open at once, so there is nothing to read
  down — a wall of text is not a contents page. A book that rearranges itself,
  so what was second is now fifth. A book that opens onto whatever was left open
  a fortnight ago instead of onto its contents. Having to open every book to
  find one thing.

  Example: at the fridge, with a book in mind
    Given the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
    When I open the book "Sweets"
    And I open the recipe "Apple cake"
    Then "Apple cake" is open with its ingredients above its method

  Example: with only part of the name, and no idea which book
    Given the book "Sweets" holds:
      | Lemon drizzle |
    And the book "Dinner" holds:
      | Lemon chicken |
    When I search for "lemon drizzle"
    Then the results name "Lemon drizzle" and say it is in "Sweets"
    When I open the result "Lemon drizzle"
    Then the open book is "Sweets"
    And "Lemon drizzle" is open

  Example: with nothing in mind, from the front door
    Given the book "Sweets" holds:
      | Apple cake |
    And "Apple cake" is a favourite
    When I open the app at the home
    Then "Apple cake" is on the home, saying it is in "Sweets"
    When I open "Apple cake" from the home
    Then the open book is "Sweets"
    And "Apple cake" is open
