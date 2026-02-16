using Microsoft.AspNetCore.Mvc;
using SphereTable_kendo.Data;

namespace SphereTable_kendo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly StudentDbContext _context;

        public CourseController(StudentDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            return Ok(_context.Courses.ToList());
        }
    }

}
