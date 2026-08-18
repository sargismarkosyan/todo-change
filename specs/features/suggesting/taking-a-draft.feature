@feature:suggesting-taking
Feature: Taking the draft

  A draft is taken a line at a time, which is the guarantee the whole feature
  rests on: a wrong quantity is a cake that fails an hour later with the oven
  on, and every line that enters the book has been looked at.

  Once the lines sit where they belong, though, a bare recipe drafted from
  nothing is a page of proposals that are all wanted, and taking them one press
  at a time is ceremony rather than care. So the lot can be taken at once — and
  that press is exactly the one to be honest about, because it is the press that
  writes a machine's whole recipe into a book without anybody reading it.

  Both ways land each line where it sat. Nothing jumps to the bottom on the way
  in; see `placing-a-draft.feature`.

  Background:
    Given the app is open
    And the AI is on
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Heat the oven to 180C |
      | Bake for 45 minutes   |

  @rule:draft-taken-whole
  Rule: The whole draft can be taken in one press, each line landing where it sat

    Example: a bare recipe, filled in at once
      Given "Apple pie" has no method
      And a model that drafts:
        | steps | 0 | Heat the oven to 180C     |
        | steps | 1 | Peel and slice the apples |
        | steps | 2 | Bake for 45 minutes       |
      When I ask for a draft of "Apple pie"
      And I take the whole draft
      Then "Apple pie" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
        | Bake for 45 minutes       |
      And there are no proposals

    Example: the ones in the middle stay in the middle
      Given a model that drafts:
        | steps | 1 | Rub the butter into the flour |
        | steps | 1 | Peel and slice the apples     |
      When I ask for a draft of "Apple pie"
      And I take the whole draft
      Then "Apple pie" shows the method:
        | Heat the oven to 180C         |
        | Rub the butter into the flour |
        | Peel and slice the apples     |
        | Bake for 45 minutes           |
