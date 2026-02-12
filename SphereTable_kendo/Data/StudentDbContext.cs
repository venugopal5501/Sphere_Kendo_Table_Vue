using Microsoft.EntityFrameworkCore;
using SphereTable_kendo.Models;
namespace SphereTable_kendo.Data
{
    public class StudentDbContext : DbContext
    {
        public StudentDbContext(DbContextOptions<StudentDbContext> options): base(options)
        {

        }
        public DbSet<Student> Students { get; set; }
    }
}