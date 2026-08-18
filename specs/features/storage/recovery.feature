@feature:storage-recovery
Feature: Surviving bad stored data

  localStorage is editable by anyone with devtools and shared with every other
  tab. The app must open on a usable screen no matter what it finds there.

  @rule:recover-from-missing-key @planned
  Rule: A missing key starts an empty list

    Example: a browser that has never opened the app
      Given "todo-change.todos" is not set
      When I open the app
      Then the list is empty
      And I see the message "Nothing to do yet."

  @rule:recover-from-unreadable-data @planned
  Rule: Unreadable stored data does not break the app

    Example: the value is not valid JSON
      Given "todo-change.todos" holds "{not json"
      When I open the app
      Then the list is empty

    Example: the value is JSON but the wrong shape
      Given "todo-change.todos" holds "{\"todos\":\"nope\"}"
      When I open the app
      Then the list is empty
