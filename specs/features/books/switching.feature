@feature:book-switching
Feature: Switching books

  Recipes live in a book, and exactly one book is open at a time. The contents
  on screen is that book's — the rest are elsewhere, not further down the same
  page.

  Switching is rare and deliberate. Writing a recipe down is not: the box at the
  top never asks which book was meant, because whatever is open is the answer.

  Searching is the one thing that reaches past the open book, and it does not
  contradict this: results are not the contents, and each one says which book it
  came from. See ../finding/spec.md.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the open book is named "Sweets"

  @rule:switch-shows-only-that-notepad
  Rule: The contents is the open book's recipes, and no other book's

    Example: two books, one visible at a time
      Given the contents reads:
        | Apple cake |
      When I open the book "Dinner"
      Then the contents is empty
      When I write down "Roast chicken"
      Then the contents reads:
        | Roast chicken |
      When I open the book "Sweets"
      Then the contents reads:
        | Apple cake |
      And the open book is named "Sweets"

  @rule:capture-goes-to-the-open-notepad
  Rule: A new recipe lands in the book on screen, without being asked

    Example: typing into the box while "Dinner" is open
      Given I open the book "Dinner"
      When I write down "Roast chicken"
      Then the contents reads:
        | Roast chicken |
      When I open the book "Sweets"
      Then the contents is empty
