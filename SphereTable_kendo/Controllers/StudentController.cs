using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SphereTable_kendo.Data;
using SphereTable_kendo.Models;
using System.Linq.Dynamic.Core;
using System.Text.Json;
using System.Text.Json.Serialization;

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
        public async Task<ActionResult> GetStudents(int skip = 0, int pageSize = 10, string? sort = null, string? filter = null)
        {
            var query = _context.Students.AsQueryable();

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            // 1️⃣ Apply Filtering
            if (!string.IsNullOrEmpty(filter))
            {
                var filterObject = JsonSerializer.Deserialize<FilterDescriptor>(filter, jsonOptions);
                query = ApplyFilters(query, filterObject);
            }

            var filteredCount = await query.CountAsync();

            // 2️⃣ Apply Sorting
            if (!string.IsNullOrEmpty(sort))
            {
                var sortList = JsonSerializer.Deserialize<List<SortDescriptor>>(sort, jsonOptions);

                if (sortList != null && sortList.Any())
                {
                    var orderString = string.Join(", ",
                        sortList.Select(s => $"{s.field} {s.dir}"));

                    query = query.OrderBy(orderString);
                }
            }
            else
            {
                query = query.OrderBy(s => s.Id);
            }

            // 3️⃣ Paging
            var data = await query.Skip(skip).Take(pageSize).ToListAsync();

            var response = new PagedResponse<Student>
            {
                Data = data,
                TotalItemsCount = await _context.Students.CountAsync(),
                FilteredItemsCount = filteredCount
            };

            return Ok(response);
        }

        // =====================================================
        // 🔵 FILTERING
        // =====================================================

        private IQueryable<Student> ApplyFilters(IQueryable<Student> query, FilterDescriptor? descriptor)
        {
            if (descriptor == null || descriptor.filters == null || !descriptor.filters.Any())
                return query;

            foreach (var filter in descriptor.filters)
            {
                if (filter.filters != null && filter.filters.Any())
                {
                    query = ApplyFilters(query, new FilterDescriptor
                    {
                        logic = filter.logic,
                        filters = filter.filters
                    });
                }
                else
                {
                    query = ApplySingleFilter(query, filter);
                }
            }

            return query;
        }

        private IQueryable<Student> ApplySingleFilter(
            IQueryable<Student> query,
            FilterCondition filter)
        {
            if (string.IsNullOrEmpty(filter.field) || string.IsNullOrEmpty(filter.Operator))
                return query;

            var field = filter.field;

            object? value = ExtractJsonValue(filter.value);

            switch (filter.Operator)
            {
                case "contains":
                    return query.Where($"{field} != null && {field}.Contains(@0)", value);

                case "startswith":
                    return query.Where($"{field} != null && {field}.StartsWith(@0)", value);

                case "endswith":
                    return query.Where($"{field} != null && {field}.EndsWith(@0)", value);

                case "eq":
                    return query.Where($"{field} == @0", value);

                case "neq":
                    return query.Where($"{field} != @0", value);

                case "gt":
                    return query.Where($"{field} > @0", value);

                case "gte":
                    return query.Where($"{field} >= @0", value);

                case "lt":
                    return query.Where($"{field} < @0", value);

                case "lte":
                    return query.Where($"{field} <= @0", value);

                case "isnull":
                    return query.Where($"{field} == null");

                case "isnotnull":
                    return query.Where($"{field} != null");

                case "isempty":
                    return query.Where($"{field} == \"\"");

                case "isnotempty":
                    return query.Where($"{field} != \"\"");
                case "doesnotcontain":
                    return query.Where($"{field} != null && !{field}.Contains(@0)", value);


                default:
                    return query;
            }
        }

        // =====================================================
        // 🔵 FIX FOR JsonElement (IMPORTANT)
        // =====================================================

        private object? ExtractJsonValue(object? value)
        {
            if (value is JsonElement element)
            {
                switch (element.ValueKind)
                {
                    case JsonValueKind.Number:
                        if (element.TryGetInt32(out int intValue))
                            return intValue;

                        if (element.TryGetDouble(out double doubleValue))
                            return doubleValue;

                        return null;

                    case JsonValueKind.String:
                        return element.GetString();

                    case JsonValueKind.True:
                    case JsonValueKind.False:
                        return element.GetBoolean();

                    case JsonValueKind.Null:
                        return null;

                    default:
                        return null;
                }
            }

            return value;
        }

        // =====================================================
        // 🔵 SUPPORT CLASSES
        // =====================================================

        public class SortDescriptor
        {
            public string? field { get; set; }
            public string? dir { get; set; }
        }

        public class FilterDescriptor
        {
            public string? logic { get; set; } = "and";
            public List<FilterCondition> filters { get; set; } = new();
        }

        public class FilterCondition
        {
            public string? field { get; set; }

            [JsonPropertyName("operator")]
            public string? Operator { get; set; }

            public object? value { get; set; }
            public string? logic { get; set; }
            public List<FilterCondition>? filters { get; set; }
        }
    }
}
