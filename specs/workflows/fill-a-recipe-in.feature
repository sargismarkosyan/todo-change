@workflow:fill-a-recipe-in @persona:nell @journey:keeping-what-you-cook
Feature: Fill a recipe in

  When a recipe exists as a name with nothing under it,
  I want what it takes and how to make it under that name,
  so it is something I can actually cook from rather than a reminder that I
  once meant to write it down.

  **Ends when** the recipe is cookable: ingredients, then a method, in the
  order they happen.

  **Why this is its own attempt and not the tail of `name-a-recipe`.** The name
  takes three seconds and this takes a dozen submissions, at a different
  moment, often on a different day. `workflows.md` said so for fifteen versions
  under the heading *"Where it also breaks, quietly"* — *"a book of names with
  nothing under them, which nothing reports because nothing went wrong"* — and
  then filed both halves under one id anyway. That is the drift issue #35 found,
  and splitting them is the fix: nine `suggesting/` feature files had no honest
  home until this workflow existed.

  **Done well.** One line each, typed and entered, ingredients above method.
  An ingredient is a line of text including its amount and is never split into
  fields. A step's number is part of what it says.

  **The accelerator, since 0009.** A machine that has a model can draft both
  groups in one press, accepted a line at a time — see
  `../features/suggesting/spec.md`. It changes nothing about `name-a-recipe`:
  the box still takes a name and Enter and never asks anything else. What it
  changes is the cost of the long half, which is the half that does not get
  done.

  **Where it breaks.** A draft written down before anybody accepted it. A
  proposal that cannot be corrected without being retyped. Anything that makes
  the twelfth line more expensive than the first.

  Example: a recipe stops being a name only
    Given the book "Sweets" is open
    And the contents reads:
      | Apple cake |
    When I open the recipe "Apple cake"
    And I add the ingredient "200g plain flour"
    And I add the ingredient "3 apples"
    And I add the step "Heat the oven to 180C"
    Then "Apple cake" has the ingredients:
      | 200g plain flour |
      | 3 apples         |
    And "Apple cake" has the method:
      | Heat the oven to 180C |

  Example: it is still filled in next time
    Given "Apple cake" has the ingredient "3 apples"
    When I come back to the app
    And I open the recipe "Apple cake"
    Then "Apple cake" has the ingredients:
      | 3 apples |

  Example: the AI fills the long half in, a line at a time
    Given the AI is on
    And the contents reads:
      | Apple cake |
    When I open the recipe "Apple cake"
    And I ask the AI for a draft
    And I take the proposal "3 apples"
    Then "Apple cake" has the ingredients:
      | 3 apples |
    And nothing else the AI proposed is written down
