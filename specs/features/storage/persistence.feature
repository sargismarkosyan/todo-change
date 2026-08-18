@feature:storage-persistence
Feature: Recipes survive a reload

  There is no server. localStorage is the only copy of the data, so anything the
  screen shows must still be there after a refresh — and what is behind it now
  may be the only record of something somebody dictated once.

  @rule:persist-across-reload
  Rule: The contents is restored exactly as it was left

    Example: names and order both come back
      Given the contents reads:
        | Lemon drizzle |
        | Apple cake    |
      When I reload the page
      Then the contents reads:
        | Lemon drizzle |
        | Apple cake    |

  @rule:persist-deletions
  Rule: A deleted recipe stays deleted

    Example: deleting then reloading
      Given the contents reads:
        | Apple cake |
      When I delete the recipe "Apple cake"
      And I reload the page
      Then the contents is empty

  @rule:persist-sub-todos
  Rule: The ingredients and the method come back with their recipe, in order

    Example: a whole recipe survives a reload
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
        | 3 apples         |
      And "Apple cake" has the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
      When I reload the page
      And I open the recipe "Apple cake"
      Then "Apple cake" shows the ingredients:
        | 200g plain flour |
        | 3 apples         |
      And "Apple cake" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |

  @rule:persist-notepads
  Rule: Books, their names and the one that was open all come back

    Example: two books and a reload
      Given the books are:
        | Sweets |
        | Dinner |
      And the open book is named "Sweets"
      And the contents reads:
        | Apple cake |
      When I open the book "Dinner"
      And I write down "Roast chicken"
      And I reload the page
      Then the open book is named "Dinner"
      And the contents reads:
        | Roast chicken |
      When I open the book "Sweets"
      Then the contents reads:
        | Apple cake |
