@feature:recipe-empty-state @workflow:find-a-recipe
Feature: The empty book

  A book with nothing in it should say so, rather than showing a blank panel
  that looks like something failed to load.

  Background:
    Given the app is open

  @rule:empty-state-on-first-visit
  Rule: A book with nothing in it explains itself

    Example: opening the app for the first time
      Given the contents is empty
      Then I see the message "No recipes in this book yet."

  @rule:empty-state-returns
  Rule: The message comes back when the last recipe goes

    Example: deleting the only recipe
      Given the contents reads:
        | Apple cake |
      When I delete the recipe "Apple cake"
      Then I see the message "No recipes in this book yet."

  @rule:empty-state-is-per-notepad
  Rule: The message is about the book you are in, not the app

    Example: one book with recipes in it, one without
      Given the books are:
        | Sweets |
        | Dinner |
      And the open book is named "Sweets"
      And the contents reads:
        | Apple cake |
      When I open the book "Dinner"
      Then I see the message "No recipes in this book yet."
