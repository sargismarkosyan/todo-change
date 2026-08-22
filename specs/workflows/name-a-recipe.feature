@workflow:name-a-recipe @persona:nell @journey:keeping-what-you-cook
Feature: Name a recipe

  When someone is reading a recipe out down the phone, or the thing in the oven
  turned out well enough to want again,
  I want the name written down before the moment passes,
  so there is something to hang the rest of it on in March.

  **Ends when** the name is at the top of the contents. Three seconds, no
  mouse, no decisions.

  **Done well.** Focus the box, type the name, press Enter. Nothing else is
  asked for at that moment, so the name lands at the speed it is being
  dictated. The new recipe is visibly *there* — at the top of the contents,
  where the eye already is.

  **The book it lands in** is whichever one is open, and the box never asks.
  That is load-bearing: the choice happens rarely, when switching books, and
  never here.

  **Where it breaks.** Anything that adds a step: a field that must be clicked,
  a book to pick, a quantity split into a number and a unit, a save button.
  Silent failure is worse — a recipe that does not appear is one nobody finds
  out about until they go looking for it a month later.

  **The box lives in a book, and since 0013 the app has a front door that is
  not one.** The three seconds are unchanged for the way this app is actually
  opened: a pinned tab holds the address of the book it was left on, so
  reopening it lands in that book with the box under the cursor. What did move
  is the cost of arriving at `#/` instead — one click into a book before there
  is anywhere to type. That is the trade this file warns about most, taken
  deliberately and only for the arrival case; see
  `../features/home/spec.md` for why the home cannot hold the box.

  **This workflow half-finishes on purpose.** A name with nothing under it is a
  complete outcome here — the rest is `fill-a-recipe-in`, and the gap between
  the two is the seam `../journeys/keeping-what-you-cook.md` exists to hold.

  Example: a recipe arrives mid-call
    Given the book "Sweets" is open
    When I write down "Apple cake"
    Then "Apple cake" is at the top of the contents
    And the box is empty, ready for the next one
    And it is in the book "Sweets"

  Example: it is still there next time
    Given the book "Sweets" is open
    And I write down "Apple cake"
    When I come back to the app
    Then "Apple cake" is at the top of the contents of "Sweets"

  Example: three of them, dictated in a row
    Given the book "Sweets" is open
    When I write down "Apple cake"
    And I write down "Lemon drizzle"
    And I write down "Bakewell tart"
    Then the contents reads:
      | Bakewell tart |
      | Lemon drizzle |
      | Apple cake    |
