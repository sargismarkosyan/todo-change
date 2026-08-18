@feature:storage-notepad-migration
Feature: A list saved before notepads existed

  Every list saved by an earlier version is a bare array under
  "todo-change.todos", with no notepad anywhere in it. It has to open exactly as
  it was left. This is the first migration in this app, and workflow 5 (Return)
  is the floor everything else stands on — a bad read here is a blank screen.

  @rule:old-list-opens-as-one-notepad
  Rule: An old list opens as a notepad called "My list"

    Example: todos saved by the previous version
      Given "todo-change.notepads" is not set
      And "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Call the bank", "done": false} |
        | {"id": "b", "text": "Buy milk", "done": true}       |
      When I open the app
      Then the open notepad is named "My list"
      And the list reads:
        | Call the bank |
        | Buy milk      |
      And "Buy milk" is shown as done

  @rule:migration-happens-once
  Rule: The old list is moved, not copied — the old key is gone afterwards

    Example: reading it once and never again
      Given "todo-change.notepads" is not set
      And "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Buy milk", "done": false} |
      When I open the app
      Then "todo-change.todos" is not set
      When I reload the page
      Then the open notepad is named "My list"
      And the list reads:
        | Buy milk |
