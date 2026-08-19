@feature:recipe-reordering-by-hand
Feature: Taking hold of a line

  A line is dragged by its grip and by nothing else. The rest of the row — the
  words themselves — is left alone on purpose, because a click there is worth
  more than a second place to start a drag: it is where editing a line will
  live, and a row that moves when you press it cannot also be a row you press to
  change it.

  That is the whole of this rule, and it is the reason the grip survived being
  replaced. Dragging the whole row is easier to hit and is what a library gives
  by default; it costs the one gesture a line most needs.

  The gesture itself is no longer this app's. It belongs to SortableJS — see
  `../../changes/0012-somebody-elses-drag.md` — so what is asserted here is
  where a drag may begin, not how one behaves once it has.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Heat the oven to 190C |
      | Bake for 45 minutes   |

  @rule:a-line-is-dragged-by-its-grip
  Rule: A drag starts on the grip, and nowhere else on the line

    Example: the words are not a handle
      Then the step "Bake for 45 minutes" cannot be dragged by its words
      And the step "Bake for 45 minutes" can be dragged by its grip

    Example: an ingredient is the same
      Given "Apple pie" has the ingredients:
        | 3 apples |
      Then the ingredient "3 apples" cannot be dragged by its words
      And the ingredient "3 apples" can be dragged by its grip

    Example: a proposal is the same
      Given the AI is on
      And a model that drafts:
        | steps | 1 | Peel and slice the apples |
      When I ask for a draft of "Apple pie"
      Then the step "Peel and slice the apples" cannot be dragged by its words
      And the step "Peel and slice the apples" can be dragged by its grip

  @rule:the-grip-does-not-wait-to-be-found
  Rule: The grip is there before it is reached for

    Example: reading the method without touching anything
      Then every step shows its grip
      And every step shows its number

    Example: an ingredient has one too
      Given "Apple pie" has the ingredients:
        | 3 apples |
      Then every ingredient shows its grip
