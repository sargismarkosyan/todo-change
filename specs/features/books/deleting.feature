@feature:book-deleting @workflow:throw-something-out
Feature: Throwing a book away

  Deleting a book is the only thing in this app that can destroy more than what
  is under the cursor, and there is still no undo. So the ceremony is
  proportional to what is at stake: an empty book goes the way a recipe goes —
  immediately, with nothing asked — and one that still holds recipes is asked
  about once, by number, before anything is lost.

  A book can only be deleted while it is open, so it has been looked at first.
  There is always at least one book.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the open book is named "Dinner"

  @rule:delete-empty-notepad-goes-without-asking
  Rule: An empty book goes on the spot, and another one opens

    Example: a book started by mistake
      Given the contents is empty
      When I delete the open book
      Then the books are:
        | Sweets |
      And the open book is named "Sweets"

  @rule:delete-notepad-with-todos-asks-first
  Rule: A book with recipes in it asks first, and says how many

    Example: agreeing to lose three recipes
      Given the contents reads:
        | Roast chicken |
        | Fish pie      |
        | Lentil soup   |
      When I delete the open book
      Then I am asked whether to lose 3 recipes
      When I agree
      Then the books are:
        | Sweets |
      And the open book is named "Sweets"

    Example: changing my mind leaves everything where it was
      Given the contents reads:
        | Roast chicken |
      When I delete the open book
      And I decline
      Then the books are:
        | Sweets |
        | Dinner |
      And the open book is named "Dinner"
      And the contents reads:
        | Roast chicken |

  @rule:last-notepad-cannot-be-deleted
  Rule: The only book left offers no way to delete it

    Example: down to one
      Given the books are:
        | Sweets |
      Then the open book offers no way to delete it
