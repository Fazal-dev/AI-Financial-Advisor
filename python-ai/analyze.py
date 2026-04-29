import sys
import pandas as pd

file_path = sys.argv[1]

try:
    df = pd.read_csv(file_path)

    revenue = df["Revenue"].sum()
    expenses = df["Expenses"].sum()
    profit = df["Profit"].sum()

    avg_profit = df["Profit"].mean()

    # 🔥 INSIGHTS
    insight = ""

    if revenue > expenses:
        insight += "The company is profitable. "
    else:
        insight += "The company is running at a loss. "

    if avg_profit > 60000:
        insight += "Profit levels are strong. "
    else:
        insight += "Profit levels are moderate. "

    if df["Expenses"].iloc[-1] > df["Expenses"].iloc[0]:
        insight += "Expenses are increasing over time. "
    else:
        insight += "Expenses are stable. "

    result = f"""
Total Revenue: {revenue}
Total Expenses: {expenses}
Total Profit: {profit}

Insight:
{insight}
"""

    print(result)

except Exception as e:
    print(f"Error: {str(e)}")