using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Collections;
using System.Text.Json;

namespace DataContracts.Pagination
{
    /// <summary>
    /// Ad advanced pagination request represents a request from the client to get data that
    /// is paginated, sorted, and filtered on the server side. The "advanced" version
    /// supports more ways to filter to align with the functionality of the Kendo UI table
    /// </summary>
    public class PagedDataRequest
    {
        [FromQuery]
        public PagedDataPagination pagination { get; set; } = new();

        [FromQuery]
        [ModelBinder(typeof(SwaggerEnumerable<List<PagedDataSort>>))]
        public IEnumerable<PagedDataSort>? sorting { get; set; } = null;

        [FromQuery]
        public PagedDataFilter? filter { get; set; } = null;

        [FromQuery]
        [ModelBinder(typeof(SwaggerEnumerable<List<VisibleColumn>>))]
        public List<VisibleColumn>? visibleColumns { get; set; } = null;

        [FromQuery]
        [ModelBinder(typeof(SwaggerEnumerable<List<kendoGroup>>))]
        public IEnumerable<kendoGroup>? grouping { get; set; } = null;

    }

    /// <summary>
    /// The request that will be sent from the Kendo UI table when
    /// requesting paged/sorted/filtered data from the API
    /// </summary>
    public class KendoTableRequest
    {
        /// <summary>
        /// The skip count (starting at zero)
        /// </summary>
        /// <example>0</example>
        [FromQuery(Name = "skip")]
        public int Skip { get; set; } = 0;

        /// <summary>
        /// The page index (starting at zero)
        /// </summary>
        /// <example>0</example>
        [FromQuery(Name = "page")]
        public int Page { get; set; } = 0;

        /// <summary>
        /// The number of items to include per page
        /// </summary>
        /// <example>25</example>
        [FromQuery(Name = "pageSize")]

        public int PageSize { get; set; } = 10;

        /// <summary>
        /// The sorting array, as a URL encoded JSON string
        /// </summary>
        /// <example>`[{\"field\":\"#FieldName#\",\"dir\":\"asc\"}]`</example>
        [FromQuery(Name = "sort")]
        public string? Sort { get; set; }

        /// <summary>
        /// The filter object, as a URL encoded JSON string
        /// </summary>
        /// <example>`{\"logic\":\"and\",\"filters\":[{\"field\":\"#FieldName#\",\"operator\":\"gt\",\"label\":\"#Condition#\",\"value\":\"#value#\"}]}`</example>
        [FromQuery(Name = "filter")]
        public string? Filter { get; set; }

        ///<summary>
        /// The columns that need to be displayed in response, asa URL encoded JSON string.
        /// </summary>
        /// <example>`[{\"ColumnField\":\"#FieldName#\",\"ColumnTitle\":\"#Field Title#\",\"ColumnOrder\":1}]`</example>
        [FromQuery(Name = "visibleColumns")]
        public string? VisibleColumns { get; set; }

        /// <summary>
        /// The grouping array, as a URL encoded JSON string
        /// </summary>
        /// <example>`[{\"field\":\"#FieldName#\",\"dir\":\"asc\"}]`</example>
        [FromQuery(Name = "group")]
        public string? Group { get; set; }
    }
    public class VisibleColumn
    {
        public string ColumnField { get; set; }
        public string ColumnTitle { get; set; }
        public int ColumnOrder { get; set; }
    }
    public class kendoGroup
    {
        public string? field { get; set; }
    }
    public class KendoSort
    {
        public string? field { get; set; }
        public string? dir { get; set; }
    }

    public class PagedDataPagination
    {
        public int skip { get; set; } = 0;
        public int page { get; set; } = 0;
        public int pageSize { get; set; } = 10;
    }
    public class PagedDataSort
    {
        public string field { get; set; }
        public bool desc { get; set; } = false;
    }
    public class PagedDataFilter
    {
        /*TODO:
        Maybe this should be 2 classes - FilterDescriptor and CompositeFilterDescriptor
        like Kendo uses? I think we could have some overloads to handle them both after
        converting a FilterDescriptor into a CompositeFilterDescriptor
        https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
        https://www.telerik.com/kendo-vue-ui/components/dataquery/api/CompositeFilterDescriptor/
        */
        #region Properties for nesting and grouping filters
        public string? logic { get; set; }

        [ModelBinder(typeof(SwaggerEnumerable<List<PagedDataFilter>>))]
        public List<PagedDataFilter>? filters { get; set; } = null;
        #endregion

        #region Leaf nodes of the filter
        public string? field { get; set; }
        public string? @operator { get; set; }
        public string? value { get; set; }
        /// <summary>
        /// A secondary value to use for the `between` comparison
        /// </summary>
        public string? value2 { get; set; }
        #endregion
    }

    public class SwaggerEnumerable<T> : IModelBinder where T : IEnumerable, new()
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            var val = bindingContext.ValueProvider.GetValue(bindingContext.FieldName);
            var first = string.Concat("[", string.Join(",", val.ToList()), "]");

            var model = new T();
            if (first != "[]")
            {
                model = JsonSerializer.Deserialize<T>(first);
            }

            bindingContext.Result = ModelBindingResult.Success(model);
            return Task.CompletedTask;
        }
    }

}
