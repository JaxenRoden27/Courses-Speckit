1. User Authentication and Authorization - Grant
2. Semester Management (CRUD) - Ana
3. Course Management (CRUD) - Ana
4. Faculty Management (CRUD) - Lorenzo
5. Section Management (CRUD) - Jaxen
6. Enrollment Management (CRUD) - Jaxen
7. Student Course Listing - Evan
8. Section Student Listing - Evan


Entities:
Users
Semesters
Courses
Faculty
Sections
Enrollments


Users
• firstName
• lastName
• email
• universityId
• userName      -- actually just going to use universityId instead
• password
• role

Semesters
• semsterName
• startDate
• endDate

Courses
• courseNumber
• courseName
• courseDescription
• courseSemesters
• courseFrequency
• courseHours
• courseDept

Faculty
• firstName
• lastName
• dept

Sections
• sectionNumber
• semesterId
• courseId
• facultyId
• daysOfWeek
• startTime
• endTime

Enrollments
• sectionId
• studentId
