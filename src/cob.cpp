#include "cob.h"

#include "file.h"

#include <string>
#include <tuple>
#include <vector>

struct TACOBFile::impl
{
  std::vector<std::uint32_t> codes;
  std::vector<std::string> pieces;
  std::vector<std::pair<std::string, std::uint32_t>> scripts;

  void parse(const std::string &input)
  {

    auto hVersionSignature = read<std::uint32_t>(input, 0);
    auto hNumberOfScripts = read<std::uint32_t>(input, 4);
    auto hNumberOfPieces = read<std::uint32_t>(input, 8);
    auto hNumberOfCodes = read<std::uint32_t>(input, 12);
    auto hUnknown_1 = read<std::uint32_t>(input, 16);
    auto hUnknown_2 = read<std::uint32_t>(input, 20);
    auto hOffsetToScriptCodeIndexArray = read<std::uint32_t>(input, 24);
    auto hOffsetToScriptNameOffsetArray = read<std::uint32_t>(input, 28);
    auto hOffsetToPieceNameOffsetArray = read<std::uint32_t>(input, 32);
    auto hOffsetToScriptCode = read<std::uint32_t>(input, 36);
    auto hOffsetToScriptNames = read<std::uint32_t>(input, 40);

    auto scriptNames = std::vector<std::string>();
    auto scriptOffsets = std::vector<std::uint32_t>();

    // std::cout << hUnknown_1 << std::endl;
    // std::cout << hUnknown_2 << std::endl;

    for (int i = 0; i < hNumberOfScripts; ++i)
    {
      auto offset = read<std::uint32_t>(input, hOffsetToScriptNameOffsetArray + i * 4);
      std::string scriptName;
      read(input, &scriptName, offset);
      auto scriptOffset = read<std::uint32_t>(input, hOffsetToScriptCodeIndexArray + i * 4);
      scripts.emplace_back(scriptName, scriptOffset);
    }

    for (int i = 0; i < hNumberOfPieces; ++i)
    {
      auto offset = read<std::uint32_t>(input, hOffsetToPieceNameOffsetArray + i * 4);
      std::string pieceName;
      read(input, &pieceName, offset);
      pieces.push_back(pieceName);
    }

    auto it = reinterpret_cast<const std::uint32_t *>(input.data() + hOffsetToScriptCode);

    codes = std::vector<std::uint32_t>{
        it,
        it + hNumberOfCodes};

  }
};

TACOBFile::TACOBFile(const std::string &input)
  : _pimpl(std::make_unique<impl>())
{
  _pimpl->parse(input);
}

TACOBFile::~TACOBFile()
{
}

void TACOBFile::ExportToPython(std::ostream &out)
{
  out << "pieces = [";
    for (int i = 0; i < _pimpl->pieces.size(); ++i)
    {
      if (i > 0)
        out << ", ";
      out << "'" << _pimpl->pieces[i] << "'";
    }
    out << "]\n";

    out << "scripts = {\n";
    for (int i = 0; i < _pimpl->scripts.size(); ++i)
    {
      auto [name, offset] = _pimpl->scripts[i];
      if (i > 0)
        out << ",\n";
      out << "\t'" << name << "': " << offset;
    }
    out << "\n}\n";

    out << "code = [";

    for (int i = 0; i < _pimpl->codes.size(); ++i)
    {
      if (i > 0)
        out << ", ";
      if (i % 8 == 0)
        out << "\n\t";
      out << "0x" << std::hex << std::setfill('0') << std::setw(8) << std::right << _pimpl->codes[i];
    }
    out << "\n]\n";

}

