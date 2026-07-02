# Project Context — DO NOT implement this file directly. Implement only the subtask pasted in chat. Changes must not break the acceptance criteria below.

---

## ⛔ Global Constraints — apply to EVERY subtask in this epic

> [!WARNING]
> **Before writing any code, confirm every constraint below is reflected in your plan.**
> These apply to all subtasks regardless of whether the subtask AC mentions them.

- **Manual Import exclusion:** Users with a Manual Import MIS connection (`misId === misIds.ManualImport`, i.e. `misId === 13`) must **never** see the "Change MIS Connection" button anywhere in the UI.

---

## Epic Summary - ES-1837
This epic covers the full front-end build of the Change MIS Connection flow within IRIS Sync Onboarding. It enables school administrators who have an existing, completed MIS connection to migrate that connection to a different Management Information System (MIS) — for example, moving from SIMS to Arbor — without having to start a new connection from scratch.

---

### Task Summary - ES-1838
As a school administrator with a completed MIS connection,
I want to initiate a Change MIS Connection process from the Dashboard,
So that I can migrate my IRIS Sync connection to a different Management Information System.

### Acceptance Criteria:

The Dashboard must display a "Change MIS Connection" button on each completed connection card under "Your Connections"

The "Change MIS Connection" button must only be visible for connections with a "Completed" status

**Must NOT:** The "Change MIS Connection" button must NOT be shown for connections where `misId === 13` (Manual Import), even when status is "Completed"

Clicking the "Change MIS Connection" button must navigate the user to the "Change MIS Connection Setup" wizard (Step 1 - Select MIS)

The "Your Connections" section must display: Organisation name, MIS type, Setup Started date, Setup By name with role badge, student count, status badge, and the Change MIS Connection button

The three summary cards (Students, Staff, Contacts) must display correct counts and descriptions

The Recent Requests panel in the left sidebar must show the relevant connection with its status

### Gherkin Requirements:

Scenario: Display Change MIS Connection button on completed connection
Given the user is logged into IRIS Sync Onboarding
And the user has a connection with status "Completed"
And the connection misId is NOT 13 (Manual Import)
When the user views the Dashboard
Then the "Change MIS Connection" button is displayed on the completed connection card

Scenario: Navigate to Change MIS Connection wizard
Given the user is on the Dashboard
And a completed connection is displayed with the "Change MIS Connection" button
When the user clicks "Change MIS Connection"
Then the user is navigated to the "Change MIS Connection Setup" page at Step 1 - Select MIS

Scenario: Hide Change MIS Connection for incomplete connections
Given the user is on the Dashboard
And a connection has a status other than "Completed"
When the user views the connection card
Then the "Change MIS Connection" button is not displayed

Scenario: Hide Change MIS Connection for Manual Import connections
Given the user is on the Dashboard
And a completed connection has misId equal to 13 (Manual Import)
When the user views the connection card
Then the "Change MIS Connection" button is NOT displayed