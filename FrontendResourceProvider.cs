using System.Reflection;
using Microsoft.Extensions.FileProviders;

namespace Astrolune.UI;

/// <summary>
/// Provides access to embedded frontend resources (app and splash)
/// </summary>
public static class FrontendResourceProvider
{
    private static readonly Assembly Assembly = typeof(FrontendResourceProvider).Assembly;
    private static readonly EmbeddedFileProvider FileProvider = new(Assembly);

    /// <summary>
    /// Get embedded resource stream by logical name
    /// </summary>
    public static Stream? GetResourceStream(string resourcePath)
    {
        return Assembly.GetManifestResourceStream(resourcePath);
    }

    /// <summary>
    /// Get file info for embedded resource
    /// </summary>
    public static IFileInfo GetFileInfo(string path)
    {
        return FileProvider.GetFileInfo(path);
    }

    /// <summary>
    /// Get directory contents
    /// </summary>
    public static IDirectoryContents GetDirectoryContents(string path)
    {
        return FileProvider.GetDirectoryContents(path);
    }

    /// <summary>
    /// List all embedded resources with a specific prefix
    /// </summary>
    public static IEnumerable<string> GetResourceNames(string prefix)
    {
        return Assembly.GetManifestResourceNames()
            .Where(name => name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }
}
