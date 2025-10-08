# app/utils/trend_updater.py

def update_trend_table(metrics: dict):
    """
    Accepts a dictionary of current report metrics and formats a trend table.
    Each entry is {metric_name, value}.
    """
    trend_table = []
    for metric_name, value in metrics.items():
        trend_table.append({
            "metric_name": metric_name,
            "value": value
        })
    return trend_table
