export class TableGrid {
    // convert html table to 2d grid of cells -> grid[row][col]
    static getGrid(table: HTMLTableElement): HTMLTableCellElement[][] {
        const grid: HTMLTableCellElement[][] = [];
        const rows = Array.from(table.rows);

        rows.forEach((row, r) => {
            // check if row exists in grid, if not create it
            const currentRow = grid[r] ?? (grid[r] = []);

            let col = 0;

            Array.from(row.cells).forEach((cell) => {
                // skip occupied cells by rowspan and colspan
                while (currentRow[col]) col++;

                const rowSpan = cell.rowSpan || 1;
                const colSpan = cell.colSpan || 1;

                // fill grid
                for (let i = 0; i < rowSpan; i++) {
                    const targetRow = grid[r + i] ?? (grid[r + i] = []);
                    for (let j = 0; j < colSpan; j++) {
                        targetRow[col + j] = cell;
                    }
                }

                col += colSpan;
            });
        });

        return grid;
    }

    static getCellPosition(
        target: HTMLTableCellElement,
        grid: HTMLTableCellElement[][]
    ): { topRow: number; topCol: number; bottomRow: number; bottomCol: number } | null {
        for (let r = 0; r < grid.length; r++) {
            const currentRow = grid[r];
            if (!currentRow) continue;
            for (let c = 0; c < currentRow.length; c++) {
                if (currentRow[c] === target) {
                    return {
                        topRow: r,
                        topCol: c,
                        bottomRow: r + (target.rowSpan || 1) - 1,
                        bottomCol: c + (target.colSpan || 1) - 1
                    };
                }
            }
        }
        return null;
    }

}