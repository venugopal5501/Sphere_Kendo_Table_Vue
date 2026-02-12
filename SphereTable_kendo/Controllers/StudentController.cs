using Microsoft.AspNetCore.Mvc;
using SphereTable_kendo.Data;
using SphereTable_kendo.Models;
using Microsoft.EntityFrameworkCore;

namespace SphereTable_kendo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentController : ControllerBase
    {
        private readonly StudentDbContext _context;

        public StudentController(StudentDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult> GetStudents()
        {
            var students = _context.Students.ToList();
            return Ok(students);
        }

    }
}