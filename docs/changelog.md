## [Unreleased]

### Added

- formdatacontext
- createexperiencebasicinfo

### Fixed

## Pending

## 9 Sept

- added formdatacontext
- added first page of createexperienceflow
- can't remove cover photo after uploading (low priority)
- added createexperiencedetails page
- added important info to ensure all attributes are there
- question: can we use inline css and do we need to create components?

## 10 sept

## ADDED

- added createexperiencedetails page and itinerary builder
- added pricing and availability pages
- Form fields: Full Description → What is Included (dynamic array) → Important Info →

## FIXED

## PENDING

- need fix styling for createexperiencedetails page
- need to ensure that it aligns with database schema
- need to fix any formating and font style errors for pricing and availability pages

## 11 sept

## ADDED

- Added ExperienceDetailsPage
- Added scheduleGenerator in utils to generate schedule records for tourist for next 3 months automatically
- Replaced hard coded schedule data with ~48 generated schedules
- consistent use of availableSpots to match backend entity (important in future)
- Show all dates button
- lightbox/modal view for photos

## FIXED

- fixed styling on create experience details page
- experience entity aligns for now
- fixed formatting and font style errors for pricing and availability page
- remove newsletter

## PENDING

- wishlist buttons need to route to regi's managewishlist
- linking experience card component to experience details
- link to reviews [sprint 2/3]
- small box to tell about duration + guide language [need link to guide first]
- category not used
- createexdets shld have back button
- max pax asked twice in createex
- style for highlights and what is included shld be same
- what is included in create experience has prefilled stuff. (fix later)
- create experience assumes return location same but can be diff (fix later)
- duration details for end location doesnt match duration details e.g. 6pm to 9pm when i said duration 8 hrs (can fix later)
- guide profile (add later)
- where are experience tags collected and placed into
- we are using formdata, but should be from api?
- price
- after creating, it doenst go back to blank state, it keeps old data.
- name is null bug
- need generate user
- what included has extra tick
- cover photo duplicated
- important info not formatted properly
- im guessing experience details page will be deleted eventually
- sometimes schedules not generated. could it be db full?
-

## 12 sept

## ADDED

- added cancellationpolicyservice with standard platform wide policy
- added frontend-backend integration for create experience (expservice.java, experienceapi.js, )
- separate endpoints for media/itin/schedules
- added dynamic routing {experience/id}
-

## FIXED

- removed customisable cancellationpolicy on frontend and backend
- dropped cancellation policy from experiences table

## PENDING

## 15 Sept

## added

- added multi day tour support for schedule generator
- added duration and category to detailsexperience
- fixed schedule generator bugs
- added startdatetime and enddatetime for experience. -> they just need duration
- added hard coded guide stuff -> need link to main one tmr
- added edit experience flow

## pending

- view guide button need to link to others
- need link edit profile
- update schema and lucid
- language missing
- edit tour button need to pop up to edit experience.
- remove all the demo/test stuff.
- experiences -start and end date if > 1 day, its multi tour -> check if there are other schedules -> then auto populate end date then check if it fits into filter -> put that experience in.

## todays plan

2. fix yesterdays pending
3. implement new cancellation policy
4. need to think about supabase, storing pics

## TO DO by sunday

3. connect with eurens part on profile page
4. connect with regis part on wishlist
5. make sure whole app flow works
6. always commit after making a lot of changes. later lost.

- bugs

1. go edit/18/details at first dh, then must go back then next then will load
2. footer not mobile resposnive?
3. some mild problems with schedules generating
4. mainly works. can commit and push
5. merge with the rest
6. wishlist likely not working cos no users.

today

- fix edit experience loading
- date time auto gone and schedules dont load
- country not specified
- need make guide not nullable
