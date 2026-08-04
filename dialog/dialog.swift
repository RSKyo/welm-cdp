import Foundation
import AppKit
import UniformTypeIdentifiers

func writeStderr(_ message: String) {
    let data = Data((message + "\n").utf8)
    FileHandle.standardError.write(data)
}

func exitWithError(_ message: String, code: Int32 = 1) -> Never {
    writeStderr(message)
    exit(code)
}

func printUsageAndExit() -> Never {
    exitWithError("""
usage:
  dialog folder [title]
  dialog file [title] [includeExtsJson]
  dialog files [title] [includeExtsJson]
  dialog save [title]
""")
}

func parseIncludeExts(_ json: String?) -> [String]? {
    guard let json = json else {
        return nil
    }

    guard let data = json.data(using: .utf8),
          let includeExts = try? JSONSerialization.jsonObject(with: data) as? [String] else {
        exitWithError("invalid includeExts JSON")
    }

    return includeExts
}

func contentTypes(for includeExts: [String]) -> [UTType] {
    includeExts.compactMap { ext in
        let filenameExtension = ext.hasPrefix(".")
            ? String(ext.dropFirst())
            : ext

        return UTType(filenameExtension: filenameExtension)
    }
}

func printPath(_ url: URL) {
    FileHandle.standardOutput.write(Data(url.path.utf8))
}

func printPaths(_ urls: [URL]) {
    let paths = urls.map { url in
        url.path
    }

    do {
        let data = try JSONSerialization.data(withJSONObject: paths)
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data("\n".utf8))
    } catch {
        exitWithError("failed to encode paths as JSON", code: 3)
    }
}

func runOpenPanel(
    canChooseFiles: Bool,
    canChooseDirectories: Bool,
    allowsMultipleSelection: Bool,
    title: String,
    includeExts: [String]? = nil
) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)
    app.activate(ignoringOtherApps: true)

    let panel = NSOpenPanel()
    panel.title = title
    panel.canChooseFiles = canChooseFiles
    panel.canChooseDirectories = canChooseDirectories
    panel.allowsMultipleSelection = allowsMultipleSelection
    panel.canCreateDirectories = true

    if let includeExts = includeExts {
        panel.allowedContentTypes = contentTypes(for: includeExts)
        panel.allowsOtherFileTypes = false
    }

    panel.begin { response in

        defer {
            NSApp.stop(nil)
        }

        guard response == .OK else {
            exit(2)
        }

        if allowsMultipleSelection {
            printPaths(panel.urls)
        } else if let url = panel.url {
            printPath(url)
        }

        exit(0)
    }

    app.run()
}

func runSavePanel(title: String) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)
    app.activate(ignoringOtherApps: true)

    let panel = NSSavePanel()
    panel.title = title

    panel.begin { response in

        defer {
            NSApp.stop(nil)
        }

        guard response == .OK,
              let url = panel.url else {
            exit(2)
        }

        printPath(url)
        exit(0)
    }

    app.run()
}

let args = Array(CommandLine.arguments.dropFirst())

guard args.count >= 1,
      args.count <= 3 else {
    printUsageAndExit()
}

let command = args[0]
let customTitle = args.count >= 2 ? args[1] : nil
let includeExts = args.count == 3 ? parseIncludeExts(args[2]) : nil

switch command {

case "folder":
    runOpenPanel(
        canChooseFiles: false,
        canChooseDirectories: true,
        allowsMultipleSelection: false,
        title: customTitle ?? "Choose Folder"
    )

case "file":
    runOpenPanel(
        canChooseFiles: true,
        canChooseDirectories: false,
        allowsMultipleSelection: false,
        title: customTitle ?? "Choose File",
        includeExts: includeExts
    )

case "files":
    runOpenPanel(
        canChooseFiles: true,
        canChooseDirectories: false,
        allowsMultipleSelection: true,
        title: customTitle ?? "Choose Files",
        includeExts: includeExts
    )

case "save":
    runSavePanel(
        title: customTitle ?? "Save File"
    )

default:
    exitWithError("unknown command: \(command)")
}
