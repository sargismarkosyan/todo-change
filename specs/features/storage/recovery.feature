@feature:storage-recovery
Feature: Surviving bad stored data

  localStorage is editable by anyone with devtools and shared with every other
  tab. The app must open on a usable screen no matter what it finds there.

  The examples naming the older keys are the migration reads — a notepad saved
  by version 0003, or a bare list saved before that, is untrusted in exactly the
  same way as a book saved after, and it opens as a usable book either way.

  @rule:recover-from-missing-key
  Rule: A browser with nothing stored starts on one empty book

    Example: a browser that has never opened the app
      Given "todo-change.books" is not set
      And "todo-change.notepads" is not set
      And "todo-change.todos" is not set
      When I open the app
      Then the open book is named "My book"
      And the contents is empty
      And I see the message "No recipes in this book yet."

  @rule:recover-from-unreadable-data
  Rule: Unreadable stored data does not break the app

    Example: the value is not valid JSON
      Given "todo-change.books" holds "{not json"
      When I open the app
      Then the open book is named "My book"
      And the contents is empty

    Example: the value is JSON but the wrong shape
      Given "todo-change.books" holds "{\"books\":\"nope\"}"
      When I open the app
      Then the contents is empty

    Example: one recipe in a book is not a recipe
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": [{"id": "r1", "name": "Apple cake"}, {"nonsense": true}]}], "openId": "b1"} |
      When I open the app
      Then the contents reads:
        | Apple cake |

  @rule:recover-from-bad-sub-todos
  Rule: Broken ingredients or method still open a usable recipe

    Example: ingredients holds something that is not a list
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": [{"id": "r1", "name": "Apple cake", "ingredients": "nope"}]}], "openId": "b1"} |
      When I open the app
      And I open the recipe "Apple cake"
      Then "Apple cake" shows no ingredients

    Example: one step is not a step, and a stored tick is not carried
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": [{"id": "r1", "name": "Apple cake", "steps": [{"id": "s1", "text": "Heat the oven to 180C", "done": true}, {"nonsense": true}]}]}], "openId": "b1"} |
      When I open the app
      And I open the recipe "Apple cake"
      Then "Apple cake" shows the method:
        | Heat the oven to 180C |
      And nothing on screen offers a tick box

  @rule:recover-from-bad-notepads
  Rule: Junk in the books key still opens a usable book

    Example: one entry in the books is not a book
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": []}, {"nonsense": true}], "openId": "b1"} |
      When I open the app
      Then the books are:
        | Sweets |

    Example: the book said to be open is not there
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": []}], "openId": "gone"} |
      When I open the app
      Then the open book is named "Sweets"
