@feature:book-creating @workflow:organise-the-books
Feature: Starting a new book

  A book is made by naming it, and it opens straight away — so the reason it was
  started is still in mind when the first recipe goes into it.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple cake |

  @rule:create-notepad-opens-it-empty
  Rule: A new book opens immediately, with nothing in it

    Example: starting a book for what is for dinner
      When I make a book called "Dinner"
      Then the open book is named "Dinner"
      And the contents is empty
      And I see the message "No recipes in this book yet."

    Example: the book it was made from is untouched
      Given I make a book called "Dinner"
      When I open the book "Sweets"
      Then the contents reads:
        | Apple cake |

  @rule:notepad-rejects-blank-name
  Rule: A book cannot be made without a name

    Example: submitting only spaces
      When I make a book called "   "
      Then the books are:
        | Sweets |
      And the open book is named "Sweets"
