@feature:storage-recovery
Feature: Surviving bad stored data

  localStorage is editable by anyone with devtools and shared with every other
  tab. The app must open on a usable screen no matter what it finds there.

  @rule:recover-from-missing-key
  Rule: A missing key starts an empty list

    Example: a browser that has never opened the app
      Given "todo-change.todos" is not set
      When I open the app
      Then the list is empty
      And I see the message "Nothing to do yet."

  @rule:recover-from-unreadable-data
  Rule: Unreadable stored data does not break the app

    Example: the value is not valid JSON
      Given "todo-change.todos" holds "{not json"
      When I open the app
      Then the list is empty

    Example: the value is JSON but the wrong shape
      Given "todo-change.todos" holds "{\"todos\":\"nope\"}"
      When I open the app
      Then the list is empty

    Example: one entry in the array is not a todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Buy milk", "done": false} |
        | {"nonsense": true}                             |
      When I open the app
      Then the list reads:
        | Buy milk |

  @planned
  @rule:recover-from-bad-sub-todos
  Rule: Broken nesting still opens a usable list

    Example: subTodos holds something that is not a list
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Buy milk", "done": false, "subTodos": "nope"} |
      When I open the app
      Then the list reads:
        | Buy milk |
      And "Buy milk" has no sub-todos

    Example: one sub-todo entry is not a todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Sort out car insurance", "done": false, "subTodos": [{"id": "b", "text": "Call current insurer", "done": false}, {"nonsense": true}]} |
      When I open the app
      Then "Sort out car insurance" has the sub-todos:
        | Call current insurer |

    Example: a parent stored as done over an unfinished sub-todo
      Given "todo-change.todos" holds a list of:
        | {"id": "a", "text": "Sort out car insurance", "done": true, "subTodos": [{"id": "b", "text": "Call current insurer", "done": false}]} |
      When I open the app
      Then "Sort out car insurance" is shown as unfinished
