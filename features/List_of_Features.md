1. User Authentication and Authorization
2. Semester Management (CRUD)
3. Course Management (CRUD)
4. Faculty Management (CRUD)
5. Section Management (CRUD)
6. Enrollment Management (CRUD)
7. Student Course Listing
8. Section Student Listing

Grant 1
Ana 2,3
Lorenzo 4
Jaxen 5,6
Evan 7,8

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
• userName
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
