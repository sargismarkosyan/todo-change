@feature:notepad-deleting
Feature: Throwing a notepad away

  Deleting a notepad is the only thing in this app that can destroy more than
  what is under the cursor, and there is still no undo. So the ceremony is
  proportional to what is at stake: an empty notepad goes the way a todo goes —
  immediately, with nothing asked — and one that still holds todos is asked
  about once, by number, before anything is lost.

  A notepad can only be deleted while it is open, so it has been looked at
  first. There is always at least one notepad.

  Background:
    Given the app is open
    And the notepads are:
      | My list |
      | Home    |
    And the open notepad is named "Home"

  @rule:delete-empty-notepad-goes-without-asking
  Rule: An empty notepad goes on the spot, and another one opens

    Example: a notepad made by mistake
      Given the list is empty
      When I delete the open notepad
      Then the notepads are:
        | My list |
      And the open notepad is named "My list"

  @rule:delete-notepad-with-todos-asks-first
  Rule: A notepad with todos in it asks first, and says how many

    Example: agreeing to lose three todos
      Given the list reads:
        | Water plants  |
        | Buy milk      |
        | Call the bank |
      When I delete the open notepad
      Then I am asked whether to lose 3 todos
      When I agree
      Then the notepads are:
        | My list |
      And the open notepad is named "My list"

    Example: changing my mind leaves everything where it was
      Given the list reads:
        | Buy milk |
      When I delete the open notepad
      And I decline
      Then the notepads are:
        | My list |
        | Home    |
      And the open notepad is named "Home"
      And the list reads:
        | Buy milk |

  @rule:last-notepad-cannot-be-deleted
  Rule: The only notepad left offers no way to delete it

    Example: down to one
      Given the notepads are:
        | My list |
      Then the open notepad offers no way to delete it
