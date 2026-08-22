@workflow:throw-something-out @persona:nell @journey:keeping-what-you-cook
Feature: Throw something out

  When a recipe turned out badly and is not going to be made again, or a whole
  book was a bad idea,
  I want it gone,
  so the contents holds only things I would actually cook.

  **Ends when** it is gone, and nothing else went with it.

  **Done well.** Rare, deliberate, and out of the way. This is maintenance, not
  hygiene: nothing accumulates here that has to be cleared, because nothing in
  this product is finished. Compare Rowan's *Prune*, which ran daily against a
  list that filled up by itself.

  **The stakes are the highest in the app**, which is why this is its own
  workflow rather than a corner of a tidying one. There is no undo, and a recipe
  may be the only copy of something somebody dictated once — see
  `../personas/nell.md`. Deleting a recipe takes its ingredients and its method
  with it; the recipe is the unit.

  **A whole book can go too**, and it is the largest thing this app can destroy.
  An empty one goes immediately; one with recipes in it asks once and says how
  many are about to go. That is the only question this app asks before deleting
  anything, and it is asked because the number is information rather than
  ceremony.

  **Where it breaks.** Deleting the wrong thing. Asking so often that the
  question stops being read. Asking in a way that does not say what is at stake
  — "Are you sure?" is ceremony; "12 recipes" is information.

  Example: a recipe that did not work
    Given the contents reads:
      | Apple cake    |
      | Lemon drizzle |
    When I delete the recipe "Apple cake"
    Then the contents reads:
      | Lemon drizzle |
    And it is still gone when I come back to the app

  Example: an empty book goes without being asked about
    Given the book "Scraps" is open and holds nothing
    When I delete the book "Scraps"
    Then the book "Scraps" is gone
    And nothing asked me to confirm it

  Example: a book with recipes in it says what is at stake
    Given the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
    When I delete the book "Sweets"
    Then I am asked once, and told that 2 recipes are about to go
    When I confirm it
    Then the book "Sweets" is gone
    And it is still gone when I come back to the app
