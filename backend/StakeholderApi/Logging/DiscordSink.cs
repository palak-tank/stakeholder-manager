using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;
using Serilog.Configuration;
using Serilog.Core;
using Serilog.Events;

namespace StakeholderApi.Logging;

public sealed class DiscordSink : ILogEventSink
{
    private static readonly HttpClient Http = new();
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly string _webhookUrl;
    private readonly IFormatProvider? _formatProvider;

    public DiscordSink(string webhookUrl, IFormatProvider? formatProvider = null)
    {
        _webhookUrl = webhookUrl;
        _formatProvider = formatProvider;
    }

    public void Emit(LogEvent logEvent) => _ = SendAsync(logEvent);

    private async Task SendAsync(LogEvent logEvent)
    {
        var (color, emoji, levelLabel) = logEvent.Level switch
        {
            LogEventLevel.Warning => (0xFEE75C, "⚠️", "Warning"),
            LogEventLevel.Error   => (0xED4245, "❌", "Error"),
            LogEventLevel.Fatal   => (0xFF0000, "💀", "Fatal"),
            _                     => (0x57F287, "✅", "Info"),
        };

        var description = logEvent.RenderMessage(_formatProvider);
        var fields = new List<EmbedField>();

        if (logEvent.Exception is not null)
        {
            fields.Add(new EmbedField(
                "Exception",
                $"`{logEvent.Exception.GetType().Name}: {logEvent.Exception.Message}`",
                false));

            var stack = logEvent.Exception.StackTrace ?? string.Empty;
            if (!string.IsNullOrEmpty(stack))
            {
                var truncated = stack.Length > 900 ? stack[..900] + "\n…" : stack;
                fields.Add(new EmbedField("Stack Trace", $"```\n{truncated}\n```", false));
            }
        }

        if (logEvent.Properties.TryGetValue("SourceContext", out var srcCtx))
        {
            var shortName = srcCtx.ToString().Trim('"').Split('.').Last();
            fields.Add(new EmbedField("Source", shortName, true));
        }

        var embed = new DiscordEmbed(
            Title: $"{emoji} {levelLabel}",
            Description: description,
            Color: color,
            Fields: fields.Count > 0 ? fields.ToArray() : null,
            Timestamp: logEvent.Timestamp.UtcDateTime.ToString("o"),
            Footer: new EmbedFooter("StakeholderApi")
        );

        var payload = JsonSerializer.Serialize(
            new { embeds = new[] { embed } },
            JsonOptions);

        try
        {
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            await Http.PostAsync(_webhookUrl, content);
        }
        catch
        {
            // Swallow — logging must never crash the app
        }
    }

    private record DiscordEmbed(
        [property: JsonPropertyName("title")]       string Title,
        [property: JsonPropertyName("description")] string Description,
        [property: JsonPropertyName("color")]       int Color,
        [property: JsonPropertyName("fields")]      EmbedField[]? Fields,
        [property: JsonPropertyName("timestamp")]   string Timestamp,
        [property: JsonPropertyName("footer")]      EmbedFooter Footer
    );

    private record EmbedField(
        [property: JsonPropertyName("name")]   string Name,
        [property: JsonPropertyName("value")]  string Value,
        [property: JsonPropertyName("inline")] bool Inline
    );

    private record EmbedFooter(
        [property: JsonPropertyName("text")] string Text
    );
}

public static class DiscordSinkExtensions
{
    public static LoggerConfiguration Discord(
        this LoggerSinkConfiguration sinkConfig,
        string webhookUrl,
        LogEventLevel restrictedToMinimumLevel = LogEventLevel.Information,
        IFormatProvider? formatProvider = null)
        => sinkConfig.Sink(new DiscordSink(webhookUrl, formatProvider), restrictedToMinimumLevel);
}
