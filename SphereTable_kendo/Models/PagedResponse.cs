namespace SphereTable_kendo.Models
{
    public class PagedResponse<T>
    {
        public List<T> Data { get; set; }
        public int TotalItemsCount { get; set; }
        public int FilteredItemsCount { get; set; }
        public ExtendedResult ExtendedResult { get; set; } = new ExtendedResult();
    }

    public class ExtendedResult
    {
        public object Data { get; set; }
        public int? TotalOwnedCount { get; set; }
        public List<int> FilteredItemsIds { get; set; }
    }
}
