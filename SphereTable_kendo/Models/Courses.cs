namespace SphereTable_kendo.Models
{
    public class Course
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; }
        public string CourseCode { get; set; }
        public int  DurationMonths { get; set; }
        public decimal Fees { get; set; }
        public string? InstructorName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedDate { get; set; }

    }
}
